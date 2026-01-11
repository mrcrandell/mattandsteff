import { prisma } from '~/server/utils/prisma'

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string || '1')
  const limit = parseInt(query.limit as string || '100')
  const skip = (page - 1) * limit

  // Get assets with pagination
  const assets = await prisma.asset.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      path: {
        not: null
      }
    }
  })

  // Get total count for pagination
  const total = await prisma.asset.count({
    where: {
      path: {
        not: null
      }
    }
  })

  // Format response similar to hubBlob().list()
  return {
    blobs: assets.map(asset => ({
      pathname: asset.path,
      size: 0, // We don't store size in DB yet, could be added
      uploadedAt: asset.createdAt,
      contentType: 'image/*', // Could be stored in DB if needed
    })),
    hasMore: page * limit < total,
    cursor: page * limit < total ? (page + 1).toString() : null,
  }
})