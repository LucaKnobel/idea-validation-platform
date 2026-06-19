import { getLatestIdeaVersion, type Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'
import type { GetIdeasOutput } from '@application/services/build-get-ideas'
import {
  IdeaDetailResponseSchema,
  IdeaResponseSchema,
  IdeaVersionsListResponseSchema,
  IdeaVersionMetadataSchema,
  type IdeaDetailResponseDto,
  IdeasListResponseSchema,
  type IdeaResponseDto,
  type IdeasListResponseDto,
  type IdeaVersionMetadataDto,
  type IdeaVersionsListResponseDto
} from '@infrastructure/validation/idea-schemas'

/**
 * Maps one idea aggregate to the public API response DTO.
 */
export const toIdeaResponseDto = (idea: Idea): IdeaResponseDto => {
  const latestVersion = getLatestIdeaVersion(idea)

  return IdeaResponseSchema.parse({
    id: idea.id,
    latestVersionId: latestVersion.id,
    title: latestVersion.title,
    description: latestVersion.description,
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString()
  })
}

/**
 * Maps one paginated idea result to the public collection DTO.
 */
export const toIdeasListResponseDto = (result: GetIdeasOutput): IdeasListResponseDto => {
  return IdeasListResponseSchema.parse({
    items: result.ideas.map(toIdeaResponseDto),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
    q: result.search
  })
}

/**
 * Maps one domain idea version to the API metadata shape and injects parent version number context.
 */
const toIdeaVersionMetadataDto = (
  version: IdeaVersion,
  parentVersionNumber: number | null
): IdeaVersionMetadataDto => {
  return IdeaVersionMetadataSchema.parse({
    id: version.id,
    versionNumber: version.versionNumber,
    type: version.type,
    parentVersionId: version.parentVersionId,
    parentVersionNumber,
    title: version.title,
    description: version.description,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString()
  })
}

/**
 * Maps one idea aggregate to detail metadata including the full version list.
 */
export const toIdeaDetailResponseDto = (idea: Idea): IdeaDetailResponseDto => {
  const versionsById = new Map(idea.versions.map(version => [version.id, version]))
  const latestVersion = getLatestIdeaVersion(idea)

  return IdeaDetailResponseSchema.parse({
    id: idea.id,
    latestVersionId: latestVersion.id,
    latestVersionNumber: latestVersion.versionNumber,
    versions: idea.versions.map((version) => {
      const parentVersion = version.parentVersionId ? versionsById.get(version.parentVersionId) : null

      return toIdeaVersionMetadataDto(version, parentVersion?.versionNumber ?? null)
    }),
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString()
  })
}

/**
 * Maps owned idea versions to the version list DTO used by dropdown/history screens.
 */
export const toIdeaVersionsListResponseDto = (versions: IdeaVersion[]): IdeaVersionsListResponseDto => {
  const versionsById = new Map(versions.map(version => [version.id, version]))

  return IdeaVersionsListResponseSchema.parse({
    items: versions.map((version) => {
      const parentVersion = version.parentVersionId ? versionsById.get(version.parentVersionId) : null

      return toIdeaVersionMetadataDto(version, parentVersion?.versionNumber ?? null)
    })
  })
}

/**
 * Maps one created idea version to the shared metadata DTO shape.
 *
 * Parent version number is intentionally not resolved here because create responses only return
 * the newly created version and not the complete sibling version set.
 */
export const toIdeaVersionMetadataResponseDto = (version: IdeaVersion): IdeaVersionMetadataDto => {
  return toIdeaVersionMetadataDto(version, null)
}
