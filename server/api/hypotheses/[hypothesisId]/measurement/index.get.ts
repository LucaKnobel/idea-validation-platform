export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'GET /api/hypotheses/:hypothesisId/measurement not implemented yet'
  })
})
