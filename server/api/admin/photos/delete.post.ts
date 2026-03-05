import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

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
  const session = await getUserSession(event);
  if (!session?.admin) {
    throw createError({
      statusCode: 403,
      statusMessage: "Unauthorized",
    });
  }

  const { id } = await readBody(event);

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing photo ID",
    });
  }

  try {
    // 1. Get Asset to find path and related posts
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assetsPosts: {
          include: {
            post: {
              include: {
                _count: {
                  select: { assetsPosts: true },
                },
              },
            },
          },
        },
      },
    });

    if (!asset) {
      throw createError({
        statusCode: 404,
        statusMessage: "Photo not found",
      });
    }

    // 2. Determine which posts become empty and should be deleted
    const postsToDelete: string[] = [];

    for (const ap of asset.assetsPosts) {
      // If the post has only 1 asset (which is this one), mark for deletion
      if (ap.post._count.assetsPosts <= 1) {
        postsToDelete.push(ap.postId);
      }
    }

    // 3. Delete from R2 (S3)
    if (asset.path) {
      try {
        await s3.send(
          new DeleteObjectCommand({
            Bucket: config.r2.bucketName,
            Key: asset.path,
          }),
        );
      } catch (s3Error) {
        console.error("Failed to delete from S3:", s3Error);
        // Continue with DB deletion even if S3 fails?
        // Usually yes, to keep DB clean, but maybe log it.
      }
    }

    // 4. Database Deletion Transaction
    await prisma.$transaction(async (tx) => {
      // Delete the asset (cascades to AssetPost)
      await tx.asset.delete({
        where: { id },
      });

      // Delete the now-empty posts
      if (postsToDelete.length > 0) {
        await tx.post.deleteMany({
          where: {
            id: { in: postsToDelete },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Delete photo error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
    });
  }
});
