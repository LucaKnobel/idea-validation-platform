export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'GET /api/hypotheses/:hypothesisId/experiment not implemented yet'
  })
})
