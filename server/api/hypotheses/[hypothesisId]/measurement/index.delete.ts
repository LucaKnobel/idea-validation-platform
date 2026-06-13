export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'DELETE /api/hypotheses/:hypothesisId/measurement not implemented yet'
  })
})
