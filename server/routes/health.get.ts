/**
 * Public liveness endpoint for the container healthcheck and deploy verification.
 * Returns the commit baked into the running image.
 */
export default defineEventHandler((event) => {
  const { appVersion, appCommit } = useRuntimeConfig().public

  setResponseHeader(event, 'cache-control', 'no-store')

  return {
    status: 'ok',
    version: appVersion,
    commit: appCommit
  }
})
