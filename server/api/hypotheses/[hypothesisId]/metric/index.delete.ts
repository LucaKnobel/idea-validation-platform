export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'DELETE /api/hypotheses/:hypothesisId/metric not implemented yet'
  })
})
