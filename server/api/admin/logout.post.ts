export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  
  if (session.admin) {
    await setUserSession(event, {
      admin: undefined,
    })
  }

  return { success: true }
})
