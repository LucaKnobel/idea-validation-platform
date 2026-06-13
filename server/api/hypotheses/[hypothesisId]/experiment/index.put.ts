export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'PUT /api/hypotheses/:hypothesisId/experiment not implemented yet'
  })
})
