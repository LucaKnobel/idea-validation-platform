import { getLatestIdeaVersion, type Idea } from '@application/models/idea'
import type { GetIdeasOutput } from '@application/services/build-get-ideas'
import {
  IdeaResponseSchema,
  IdeasListResponseSchema,
  type IdeaResponseDto,
  type IdeasListResponseDto
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
