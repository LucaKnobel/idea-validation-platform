import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Idea } from '@application/models/idea'
import type { Logger } from '@interfaces/logger'

export type GetIdeasInput = {
  userId: string
  search: string | null
  page: number
  pageSize: number
}

export type GetIdeasOutput = {
  ideas: Idea[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  search: string | null
}

/**
 * Builds the use case that lists a user's ideas with search and pagination metadata.
 */
export const createGetIdeas = (ideaVersionRepository: IdeaVersionRepository, logger: Logger) => {
  return async (input: GetIdeasInput): Promise<GetIdeasOutput> => {
    const normalizedSearch = input.search && input.search.trim().length > 0
      ? input.search.trim()
      : null

    const result = await ideaVersionRepository.listIdeasByUser({
      userId: input.userId,
      search: normalizedSearch,
      page: input.page,
      pageSize: input.pageSize
    })

    const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / input.pageSize)

    logger.debug('Ideas listed', {
      userId: input.userId,
      page: input.page,
      pageSize: input.pageSize,
      items: result.ideas.length,
      total: result.total
    })

    return {
      ideas: result.ideas,
      page: input.page,
      pageSize: input.pageSize,
      total: result.total,
      totalPages,
      search: normalizedSearch
    }
  }
}
