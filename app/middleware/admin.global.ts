export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin') || to.path === '/admin-login') return

  const { session } = useUserSession()
  
  if (!session.value?.admin) {
    return navigateTo('/admin-login')
  }
})
