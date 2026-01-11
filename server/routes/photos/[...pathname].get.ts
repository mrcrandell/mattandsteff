import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'
import { lookup } from 'mime-types'

export default eventHandler(async (event) => {
  const pathname = getRouterParam(event, 'pathname')
  
  if (!pathname) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid pathname' })
  }

  // Security: only allow files in photos directory
  if (!pathname.startsWith('photos/')) {
    throw createError({ statusCode: 403, statusMessage: 'Access denied' })
  }

  const filePath = join(process.cwd(), 'uploads', pathname)
  
  try {
    // Check if file exists
    await stat(filePath)
    
    // Get MIME type
    const contentType = lookup(filePath) || 'application/octet-stream'
    
    // Set headers
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000') // 1 year cache
    
    // Stream the file
    return sendStream(event, createReadStream(filePath))
  } catch (error) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }
})
