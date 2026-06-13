import type { CanvasElementType } from '@application/models/canvas-element'
import type {
  Hypothesis,
  HypothesisDimension,
  HypothesisEvidenceType,
  HypothesisPriority
} from '@application/models/hypothesis'
import type { IdeaVersionOwnerInput, HypothesisOwnerInput } from '@application/interfaces/ownership-inputs'

export type HypothesisUpdateFieldsInput = {
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  canvasSectionTypes: CanvasElementType[]
}

export type HypothesisCreateFieldsInput = HypothesisUpdateFieldsInput & {
  evidenceType: HypothesisEvidenceType
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
   * Returns one hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  getByIdForUser(input: HypothesisOwnerInput): Promise<Hypothesis | null>

  /**
   * Creates one hypothesis in a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  createForIdeaVersion(input: IdeaVersionOwnerInput & HypothesisCreateFieldsInput): Promise<Hypothesis | null>

  /**
   * Updates one hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  updateByIdForUser(input: HypothesisOwnerInput & HypothesisUpdateFieldsInput): Promise<Hypothesis | null>

  /**
   * Deletes one hypothesis owned by the given user.
   * Returns true when a row was deleted.
   */
  deleteByIdForUser(input: HypothesisOwnerInput): Promise<boolean>
}
