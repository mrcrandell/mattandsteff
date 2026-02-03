import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import sharp from "sharp";
import heicConvert from "heic-convert";

// Initialize S3 Client
const config = useRuntimeConfig();
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export default eventHandler(async (event) => {
  // 1. Authenticate
  const session = await requireUserSession(event);
  const sessionPhone = (session.user as any).phone;

  // 2. Parse Multipart Data
  const parts = await readMultipartFormData(event);
  if (!parts) {
    throw createError({ statusCode: 400, message: "No data uploaded" });
  }

  const files = [];
  let name = "";
  let phone = "";
  let message = "";

  for (const part of parts) {
    if (part.name === "name") name = part.data.toString();
    else if (part.name === "phone") phone = part.data.toString();
    else if (part.name === "message") message = part.data.toString();
    else if (part.filename) {
      files.push(part);
    }
  }

  if (files.length === 0) {
    throw createError({ statusCode: 400, message: "No files uploaded" });
  }

  // 3. Process Files (Parallel)
  const processedFiles = await Promise.all(
    files.map(async (file) => {
      // Basic Validation
      // Note: heic-convert works on image/heic, but browsers upload as image/heic or empty type sometimes
      if (
        !file.type.startsWith("image/") &&
        !file.filename?.toLowerCase().endsWith(".heic")
      ) {
        throw createError({
          statusCode: 400,
          message: `Invalid file type: ${file.filename}`,
        });
      }

      // Buffer preparation
      let inputBuffer = file.data;
      if (
        file.type.toLowerCase().includes("heic") ||
        file.filename?.toLowerCase().endsWith(".heic")
      ) {
        inputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: "JPEG",
          quality: 1,
        }) as Buffer;
      }

      // Generate Asset ID
      const assetId = crypto.randomUUID();
      const basePath = `photos/${assetId}`;

      // Sharp Pipeline
      const image = sharp(inputBuffer).rotate(); // Auto-rotate based on EXIF

      // We need to strip EXIF. sharp().toBuffer() without .withMetadata() strips it.

      // 1. Original Archive (Max 4000px, Q90)
      const originalBuffer = await image
        .clone()
        .resize({
          width: 4000,
          height: 4000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // 2. Large Display (Max 2560px, Q85)
      const largeBuffer = await image
        .clone()
        .resize({
          width: 2560,
          height: 2560,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // 3. Thumbnail (Width 400px, Q75)
      const thumbBuffer = await image
        .clone()
        .resize({ width: 400 })
        .jpeg({ quality: 75 })
        .toBuffer();

      // Upload to R2 (Parallel)
      await Promise.all([
        s3.send(
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/original.jpg`,
            Body: originalBuffer,
            ContentType: "image/jpeg",
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/large.jpg`,
            Body: largeBuffer,
            ContentType: "image/jpeg",
          }),
        ),
        s3.send(
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/thumb.jpg`,
            Body: thumbBuffer,
            ContentType: "image/jpeg",
          }),
        ),
      ]);

      return {
        id: assetId,
        path: basePath, // Storing the prefix
      };
    }),
  );

  // 4. Database Transaction
  const result = await prisma.$transaction(async (tx) => {
    // A. Resolve User
    let userId: string | null = null;

    // Prioritize form phone, then session phone
    const targetPhone = phone || sessionPhone;

    if (targetPhone) {
      // Try to find existing user
      let user = await tx.user.findUnique({ where: { phone: targetPhone } });

      if (user) {
        // Update name if provided and different
        if (name && name.trim() !== "" && name !== user.name) {
          user = await tx.user.update({
            where: { id: user.id },
            data: { name },
          });
        }
      } else if (phone && name) {
        // Create new user ONLY if both phone and name are provided (User model requires name)
        // If name is missing but phone is present, we technically can't create a User
        // without violating the schema (name is String, not optional).
        user = await tx.user.create({
          data: { phone, name },
        });
      } else if (phone && !name) {
        // Fallback: If just phone is provided, create a user with a placeholder name?
        // Or treat as anonymous?
        // Let's create with "Guest" to capture the phone number interaction.
        user = await tx.user.create({
          data: { phone, name: "Friend & Family" },
        });
      }

      if (user) {
        userId = user.id;
      }
    }

    // B. Create Post
    const post = await tx.post.create({
      data: {
        text: message || null,
        userId: userId,
      },
    });

    // C. Create Assets and Links
    for (const file of processedFiles) {
      await tx.asset.create({
        data: {
          id: file.id,
          path: file.path,
          userId: userId,
          assetsPosts: {
            create: {
              postId: post.id,
            },
          },
        },
      });
    }

    return { postId: post.id, assets: processedFiles.length };
  });

  return { success: true, ...result };
});
