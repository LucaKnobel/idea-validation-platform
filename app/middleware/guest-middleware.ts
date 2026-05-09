export default defineNuxtRouteMiddleware(async () => {
  const localePath = useLocalePath()
  const { data: session } = await authClient.useSession(useFetch)

  if (session.value) {
    return navigateTo(localePath('/dashboard'))
  }
})
