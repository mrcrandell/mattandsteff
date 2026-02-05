import type { Photo } from "~~/shared/types/photo";

export default eventHandler(async (event) => {
  const query = getQuery(event);
  const page = parseInt(query.page as string || "1");
  const limit = parseInt(query.limit as string || "100");
  const skip = (page - 1) * limit;

  // Get assets with pagination
  const assets = await prisma.asset.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      path: {
        not: null,
      },
    },
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
    where: {
      path: {
        not: null,
      },
    },
  });

  // Format response similar to hubBlob().list()
  return {
    imgs: assets.map((asset) => {
      // asset.path is stored as "photos/<uuid>"
      // transform to usable paths
      const fileId = asset.path ? asset.path.replace("photos/", "") : asset.id;

      return {
        id: asset.id,
        pathname: `${fileId}/original.jpg`,
        size: 0,
        uploadedAt: asset.createdAt,
        contentType: "image/jpeg",
        urls: {
          original: `/photos/${fileId}/original.jpg`,
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
