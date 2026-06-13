export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'PUT /api/hypotheses/:hypothesisId/metric not implemented yet'
  })
})
