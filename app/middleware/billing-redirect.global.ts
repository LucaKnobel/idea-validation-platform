const BILLING_RETURN_PATHS = new Set(['/billing/success', '/billing/failed'])

export default defineNuxtRouteMiddleware((to) => {
  if (!BILLING_RETURN_PATHS.has(to.path)) {
    return
  }

  const localePath = useLocalePath()

  return navigateTo(
    {
      path: localePath(to.path),
      query: to.query
    },
    { redirectCode: 302 }
  )
})
