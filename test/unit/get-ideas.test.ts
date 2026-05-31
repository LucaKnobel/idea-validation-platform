import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetIdeas } from '@application/services/get-ideas'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdea, makeIdeaVersionRepository, makeLogger } from './helpers'

describe('createGetIdeas', () => {
  let versionRepository: IdeaVersionRepository
  let logger: Logger
  let getIdeas: ReturnType<typeof createGetIdeas>

  beforeEach(() => {
    versionRepository = makeIdeaVersionRepository()
    logger = makeLogger()
    getIdeas = createGetIdeas(versionRepository, logger)
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({ ideas: [], total: 0 })
  })

  it('calls listByUserId with the correct input', async () => {
    await getIdeas({ userId: 'user-001', search: 'saas', page: 2, pageSize: 5 })

    expect(versionRepository.listIdeasByUser).toHaveBeenCalledWith({
      userId: 'user-001',
      search: 'saas',
      page: 2,
      pageSize: 5
    })
  })

  it('returns the ideas from the repository', async () => {
    const ideas = [makeIdea({ id: 'idea-1' }), makeIdea({ id: 'idea-2' })]
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({ ideas, total: 2 })

    const result = await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(result.ideas).toEqual(ideas)
  })

  it('returns correct pagination metadata', async () => {
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({
      ideas: [makeIdea({ id: 'idea-1' })],
      total: 25
    })

    const result = await getIdeas({ userId: 'user-001', search: null, page: 2, pageSize: 10 })

    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(10)
    expect(result.total).toBe(25)
    expect(result.totalPages).toBe(3)
  })

  it('returns totalPages of 0 when total is 0', async () => {
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({ ideas: [], total: 0 })

    const result = await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(0)
  })

  it('calculates totalPages correctly when total is exactly divisible by pageSize', async () => {
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({ ideas: [], total: 20 })

    const result = await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(2)
  })

  it('calculates totalPages correctly when there is a remainder', async () => {
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({ ideas: [], total: 11 })

    const result = await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(result.totalPages).toBe(2)
  })

  it('normalizes search by trimming whitespace', async () => {
    await getIdeas({ userId: 'user-001', search: '  saas  ', page: 1, pageSize: 10 })

    expect(versionRepository.listIdeasByUser).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'saas' })
    )
  })

  it('treats whitespace-only search as null', async () => {
    await getIdeas({ userId: 'user-001', search: '   ', page: 1, pageSize: 10 })

    expect(versionRepository.listIdeasByUser).toHaveBeenCalledWith(
      expect.objectContaining({ search: null })
    )
  })

  it('passes null search through unchanged', async () => {
    await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(versionRepository.listIdeasByUser).toHaveBeenCalledWith(
      expect.objectContaining({ search: null })
    )
  })

  it('returns the normalized search value in the result', async () => {
    const result = await getIdeas({
      userId: 'user-001',
      search: '  saas  ',
      page: 1,
      pageSize: 10
    })

    expect(result.search).toBe('saas')
  })

  it('returns null search in the result when input is whitespace-only', async () => {
    const result = await getIdeas({ userId: 'user-001', search: '   ', page: 1, pageSize: 10 })

    expect(result.search).toBeNull()
  })

  it('logs a debug message after fetching', async () => {
    vi.mocked(versionRepository.listIdeasByUser).mockResolvedValue({
      ideas: [makeIdea({ id: 'idea-1' })],
      total: 1
    })

    await getIdeas({ userId: 'user-001', search: null, page: 1, pageSize: 10 })

    expect(logger.debug).toHaveBeenCalledWith('Ideas listed', expect.objectContaining({
      userId: 'user-001',
      page: 1,
      pageSize: 10,
      items: 1,
      total: 1
    }))
  })
})
