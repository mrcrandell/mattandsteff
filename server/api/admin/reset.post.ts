import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { z } from "zod";

const resetSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event);
  if (!session.admin) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const { password } = await readValidatedBody(
    event,
    (body) => resetSchema.parse(body),
  );

  // Validate Admin Password
  const admin = await prisma.admin.findUnique({
    where: { id: (session.admin as any).id },
  });

  const isValid = admin &&
    (await customVerifyPassword(password, admin.passwordHash));

  if (!isValid) {
    throw createError({
      statusCode: 401,
      message: "Invalid password",
    });
  }

  const config = useRuntimeConfig();

  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2.accessKeyId,
      secretAccessKey: config.r2.secretAccessKey,
    },
  });

  try {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const listCommand: any = new ListObjectsV2Command({
        Bucket: config.r2.bucketName,
        ContinuationToken: continuationToken,
      });
      const response: any = await s3.send(listCommand);

      if (response.Contents && response.Contents.length > 0) {
        const deleteCommand = new DeleteObjectsCommand({
          Bucket: config.r2.bucketName,
          Delete: {
            Objects: response.Contents.map((obj: any) => ({ Key: obj.Key })),
            Quiet: true,
          },
        });
        await s3.send(deleteCommand);
      }

      isTruncated = response.IsTruncated ?? false;
      continuationToken = response.NextContinuationToken;
    }
  } catch (error) {
    console.error("Error clearing S3 bucket:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear storage bucket",
    });
  }

  try {
    await prisma.$transaction([
      prisma.assetPost.deleteMany(),
      prisma.post.deleteMany(),
      prisma.asset.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  } catch (error) {
    console.error("Error clearing database:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to clear database",
    });
  }

  return { success: true };
});
