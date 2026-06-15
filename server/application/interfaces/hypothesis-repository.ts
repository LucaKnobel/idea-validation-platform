import type { CanvasElementType } from '@application/models/canvas-element'
import type {
  Hypothesis,
  HypothesisDimension,
  HypothesisEvidenceType,
  HypothesisPriority,
  HypothesisStatus
} from '@application/models/hypothesis'
import type { IdeaVersionOwnerInput, HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'

export type HypothesisUpdateFieldsInput = {
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  evidenceType: HypothesisEvidenceType
  canvasElementTypes: CanvasElementType[]
}

export type HypothesisCreateFieldsInput = HypothesisUpdateFieldsInput

export type HypothesisStatusUpdateInput = HypothesisIdOwnerInput & {
  status: HypothesisStatus
}

/**
 * Persistence contract for reading and mutating hypotheses in one owned idea version.
 */
export interface HypothesisRepository {
  /**
   * Returns all hypotheses for a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  listByIdeaVersion(input: IdeaVersionOwnerInput): Promise<Hypothesis[] | null>

  /**
   * Returns one hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  getById(input: HypothesisIdOwnerInput): Promise<Hypothesis | null>

  /**
   * Creates one hypothesis in a version owned by the given user.
   * Returns null when the version does not exist or is not accessible.
   */
  create(input: IdeaVersionOwnerInput & HypothesisCreateFieldsInput): Promise<Hypothesis | null>

  /**
   * Updates one hypothesis owned by the given user.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  update(input: HypothesisIdOwnerInput & HypothesisUpdateFieldsInput): Promise<Hypothesis | null>

  /**
   * Updates only the derived status of one owned hypothesis.
   * Returns null when the hypothesis does not exist or is not accessible.
   */
  updateStatus(input: HypothesisStatusUpdateInput): Promise<Hypothesis | null>

  /**
   * Deletes one hypothesis owned by the given user.
   * Returns true when a row was deleted.
   */
  delete(input: HypothesisIdOwnerInput): Promise<boolean>
}
