import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const config = useRuntimeConfig();

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
  // Prevent SDK from adding checksum headers that browser fetch won't send
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export default eventHandler(async (event) => {
  // 1. Authenticate
  await requireUserSession(event);

  // 2. Parse body
  const body = await readBody(event);
  const { files } = body as { files: { type: string; size: number }[] };

  if (!files || !Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, message: "No files specified" });
  }

  // Enforce limits
  if (files.length > 20) {
    throw createError({
      statusCode: 400,
      message: "Too many files at once (max 20)",
    });
  }

  // 3. Generate Signed URLs
  const uploads = await Promise.all(
    files.map(async (file) => {
      // Validate file type (basic)
      if (!file.type.startsWith("image/") && file.type !== "image/heic") {
        // Allow it for now, but client should handle conversion
      }

      const assetId = crypto.randomUUID();
      const basePath = `photos/${assetId}`;
      const expires = 600; // 10 minutes

      // We expect the client to upload 3 variants per file
      // All variants will be JPEGs if we follow the client-side processing plan

      const [originalUrl, largeUrl, thumbUrl] = await Promise.all([
        getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/original.jpg`,
            ContentType: "image/jpeg",
          }),
          { expiresIn: expires },
        ),
        getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/large.jpg`,
            ContentType: "image/jpeg",
          }),
          { expiresIn: expires },
        ),
        getSignedUrl(
          s3,
          new PutObjectCommand({
            Bucket: config.r2.bucketName,
            Key: `${basePath}/thumb.jpg`,
            ContentType: "image/jpeg",
          }),
          { expiresIn: expires },
        ),
      ]);

      return {
        id: assetId,
        path: basePath,
        urls: {
          original: originalUrl,
          large: largeUrl,
          thumb: thumbUrl,
        },
      };
    }),
  );

  return uploads;
});
