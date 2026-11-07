import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCreateIdea } from '@application/services/build-create-idea'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdea, makeIdeaRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildCreateIdea', () => {
  let repository: IdeaRepository
  let logger: Logger
  let createIdea: ReturnType<typeof buildCreateIdea>

  beforeEach(() => {
    repository = makeIdeaRepository()
    logger = makeLogger()
    createIdea = buildCreateIdea(repository, logger)
    vi.mocked(repository.create).mockResolvedValue(makeIdea())
  })

  it('creates the idea with the provided input', async () => {
    await createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: 'A description' })

    expect(repository.create).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      title: 'Test Idea',
      description: 'A description'
    })
  })

  it('returns the created idea', async () => {
    const idea = makeIdea({ id: 'idea-xyz' })
    vi.mocked(repository.create).mockResolvedValue(idea)

    const result = await createIdea({ userId: VALID_USER_ID, title: 'My Idea', description: null })

    expect(result).toEqual(idea)
  })

  it('logs a debug message after successful creation', async () => {
    vi.mocked(repository.create).mockResolvedValue(makeIdea({ id: 'idea-xyz' }))

    await createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: null })

    expect(logger.debug).toHaveBeenCalledWith('Idea created', { userId: VALID_USER_ID, ideaId: 'idea-xyz' })
  })
})
