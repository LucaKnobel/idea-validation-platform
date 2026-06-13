export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'PUT /api/hypotheses/:hypothesisId/measurement not implemented yet'
  })
})
