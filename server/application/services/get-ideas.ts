import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'
import type { Logger } from '@interfaces/logger'

export const createGetIdeas = (ideaRepository: IdeaRepository, logger: Logger) => {
  return async (input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{
    ideas: Idea[]
    page: number
    pageSize: number
    total: number
    totalPages: number
    search: string | null
  }> => {
    const normalizedSearch = input.search && input.search.trim().length > 0
      ? input.search.trim()
      : null

    const result = await ideaRepository.listByUserId({
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
