export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const storage = useStorage('cache')
  const key = `ratelimit:passcode:${ip}`
  const attempts = await storage.getItem<number>(key) || 0

  if (attempts >= 5) {
    throw createError({
      statusCode: 429,
      message: 'Too many requests'
    })
  }

  await storage.setItem(key, attempts + 1, { ttl: 60 })

  const body = await readBody(event)
  const config = useRuntimeConfig()

  if (body.code !== config.passcode) {
    throw createError({
      statusCode: 401,
      message: 'Invalid passcode'
    })
  }

  await storage.removeItem(key)

  await setUserSession(event, {
    user: {
      loggedIn: true
    }
  })

  return { success: true }
})
