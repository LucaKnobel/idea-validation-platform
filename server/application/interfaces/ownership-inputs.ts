/**
 * Ownership scope for one idea owned by one user.
 */
export type IdeaOwnerInput = {
  userId: string
  ideaId: string
}

/**
 * Ownership scope for one specific idea version owned by one user.
 */
export type IdeaVersionOwnerInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

/**
 * Ownership scope for one hypothesis identified by hypothesisId and userId.
 */
export type HypothesisIdOwnerInput = {
  userId: string
  hypothesisId: string
}
