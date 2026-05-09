export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const { data: session } = await authClient.useSession(useFetch)

  if (!session.value) {
    return navigateTo({ path: localePath('/auth/login'), query: { redirect: to.fullPath } })
  }
})
