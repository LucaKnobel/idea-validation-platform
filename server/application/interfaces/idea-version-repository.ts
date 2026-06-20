import type { Idea } from '@application/models/idea'
import type { IdeaVersion, IdeaVersionType } from '@application/models/idea-version'
import type { HypothesisStatus } from '@application/models/hypothesis'
import type { IdeaOwnerInput, IdeaVersionOwnerInput } from '@application/interfaces/ownership-inputs'

export type IdeaVersionListInput = {
  userId: string
  search: string | null
  page: number
  pageSize: number
}

/**
 * Allowed target version types when creating a version from another version.
 */
export type CreateVersionType = Exclude<IdeaVersionType, 'INITIAL'>

/**
 * Minimal hypothesis data needed to decide whether it should be copied.
 */
export type SourceHypothesis = {
  id: string
  status: HypothesisStatus
}

/**
 * Minimal base-version payload needed by the service to derive a new version.
 */
export type VersionSource = {
  baseVersion: IdeaVersion
  hypotheses: SourceHypothesis[]
}

/**
 * Input for creating a new version from a selected base version.
 */
export type CreateVersionFromSourceInput = {
  userId: string
  ideaId: string
  baseVersionId: string
  type: CreateVersionType
  hypothesisIdsToCopy: string[]
}

/**
 * Input for updating one owned idea version metadata snapshot.
 */
export type UpdateIdeaVersionMetadataInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
  title: string
  description: string | null
}

export interface IdeaVersionRepository {
  /**
   * Lists idea cards for one user. Each idea contains only its latest version.
   */
  listByUser(input: IdeaVersionListInput): Promise<{ ideas: Idea[], total: number }>

  /**
   * Returns one owned idea with all versions sorted by version number descending.
   * Returns null when the idea is not accessible to the user.
   */
  getByIdea(input: IdeaOwnerInput): Promise<Idea | null>

  /**
   * Returns all versions for one owned idea sorted by version number descending.
   * Returns null when the idea is not accessible to the user.
   */
  listByIdea(input: IdeaOwnerInput): Promise<IdeaVersion[] | null>

  /**
   * Loads the selected base version and hypothesis states needed for copy rules.
   * Returns null when the base version is not accessible to the user.
   */
  getVersionSource(input: IdeaVersionOwnerInput): Promise<VersionSource | null>

  /**
   * Creates a new version from a base version and copies selected snapshot data.
   * Returns null when the base version is not accessible to the user.
   */
  createFromSource(input: CreateVersionFromSourceInput): Promise<IdeaVersion | null>

  /**
   * Updates metadata (title and description) on one owned idea version.
   * Returns null when the version is not accessible to the user.
   */
  updateMetadata(input: UpdateIdeaVersionMetadataInput): Promise<IdeaVersion | null>
}
