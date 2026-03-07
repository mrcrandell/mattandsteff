import type { Photo } from "~~/shared/types/photo";

export default eventHandler(async (event) => {
  const session = await getUserSession(event);
  const isAdmin = !!session.admin;

  const query = getQuery(event);
  const page = parseInt(query.page as string || "1");
  const limit = parseInt(query.limit as string || "100");
  const skip = (page - 1) * limit;

  const where: any = {
    path: {
      not: null,
    },
  };

  if (!isAdmin) {
    where.isHidden = false;
  }

  // Get assets with pagination
  const assets = await prisma.asset.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    where,
    include: {
      user: {
        select: {
          name: true,
        },
      },
      assetsPosts: {
        include: {
          post: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Get total count for pagination
  const total = await prisma.asset.count({
    where,
  });

  // Format response similar to hubBlob().list()
  return {
    imgs: assets.map((asset) => {
      // asset.path is stored as "photos/<uuid>"
      // transform to usable paths
      const fileId = asset.path ? asset.path.replace("photos/", "") : asset.id;

      let originalUrl = `/photos/${fileId}/original.jpg`;
      if (asset.mediaType === "VIDEO") {
        const ext = asset.mimeType?.includes("quicktime") ? "mov" : "mp4";
        originalUrl = `/photos/${fileId}/original.${ext}`;
      }

      return {
        id: asset.id,
        pathname: `${fileId}/original.jpg`, // pathname is mostly for key reference
        isHidden: asset.isHidden,
        size: 0,
        uploadedAt: asset.createdAt,
        contentType: asset.mimeType || "image/jpeg",
        mediaType: asset.mediaType,
        urls: {
          original: originalUrl,
          large: `/photos/${fileId}/large.jpg`,
          thumbnail: `/photos/${fileId}/thumb.jpg`,
        },
        user: asset.user,
        post: asset.assetsPosts[0]?.post || null,
      } as Photo;
    }),
    hasMore: page * limit < total,
    cursor: page * limit < total ? (page + 1).toString() : null,
  };
});
