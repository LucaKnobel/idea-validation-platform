import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetIdeas } from '@application/services/build-get-ideas'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdea, makeIdeaVersionRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildGetIdeas', () => {
  let versionRepository: IdeaVersionRepository
  let logger: Logger
  let getIdeas: ReturnType<typeof buildGetIdeas>

  beforeEach(() => {
    versionRepository = makeIdeaVersionRepository()
    logger = makeLogger()
    getIdeas = buildGetIdeas(versionRepository, logger)
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas: [], total: 0 })
  })

  it('calls listByUser with the correct input', async () => {
    await getIdeas({ userId: VALID_USER_ID, search: 'saas', page: 2, pageSize: 5 })

    expect(versionRepository.listByUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      search: 'saas',
      page: 2,
      pageSize: 5
    })
  })

  it('passes null search through unchanged', async () => {
    await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(versionRepository.listByUser).toHaveBeenCalledWith(
      expect.objectContaining({ search: null })
    )
  })

  it('returns the ideas from the repository', async () => {
    const ideas = [makeIdea({ id: 'idea-1' }), makeIdea({ id: 'idea-2' })]
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas, total: 2 })

    const result = await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(result.ideas).toEqual(ideas)
  })

  it('returns correct pagination metadata', async () => {
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas: [], total: 25 })

    const result = await getIdeas({ userId: VALID_USER_ID, search: null, page: 2, pageSize: 10 })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('returns totalPages of 0 when total is 0', async () => {
    const result = await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(0)
  })

  it('calculates totalPages correctly when total is exactly divisible', async () => {
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas: [], total: 20 })

    const result = await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(2)
  })

  it('calculates totalPages correctly with a remainder', async () => {
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas: [], total: 11 })

    const result = await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(2)
  })

  it('returns the search value in the result unchanged', async () => {
    const result = await getIdeas({ userId: VALID_USER_ID, search: 'saas', page: 1, pageSize: 10 })

    expect(result.search).toBe('saas')
  })

  it('logs a debug message after fetching', async () => {
    vi.mocked(versionRepository.listByUser).mockResolvedValue({ ideas: [makeIdea()], total: 1 })

    await getIdeas({ userId: VALID_USER_ID, search: null, page: 1, pageSize: 10 })

    expect(logger.debug).toHaveBeenCalledWith('Ideas listed', expect.objectContaining({
      userId: VALID_USER_ID,
      page: 1,
      pageSize: 10,
      items: 1,
      total: 1
    }))
  })
})
