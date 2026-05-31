import type { CanvasElementType } from '@application/models/canvas-element'
import type { Hypothesis, HypothesisDimension, HypothesisPriority } from '@application/models/hypothesis'

type IdeaVersionOwnerInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

type HypothesisOwnerInput = IdeaVersionOwnerInput & {
  hypothesisId: string
}

type HypothesisFieldsInput = {
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  canvasSectionTypes: CanvasElementType[]
}

/**
 * Persistence contract for reading and mutating hypotheses in one owned idea version.
 */
export interface HypothesisRepository {
  /**
   * Returns all hypotheses for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  listByIdeaVersionForUser(input: IdeaVersionOwnerInput): Promise<Hypothesis[] | null>

  /**
   * Creates one hypothesis in a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  createForIdeaVersion(input: IdeaVersionOwnerInput & HypothesisFieldsInput): Promise<Hypothesis | null>

  /**
   * Updates one hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  updateByIdForUser(input: HypothesisOwnerInput & HypothesisFieldsInput): Promise<Hypothesis | null>

  /**
   * Deletes one hypothesis owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: HypothesisOwnerInput): Promise<boolean>
}
