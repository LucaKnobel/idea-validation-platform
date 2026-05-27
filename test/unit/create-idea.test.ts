import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreateIdea } from '@application/services/create-idea'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'
import {
  makeIdea,
  makeIdeaRepository,
  makeSubscriptionService,
  makeLogger
} from './helpers'

describe('createCreateIdea', () => {
  let repository: IdeaRepository
  let subscriptionService: SubscriptionService
  let logger: Logger
  let createIdea: ReturnType<typeof createCreateIdea>

  beforeEach(() => {
    repository = makeIdeaRepository()
    subscriptionService = makeSubscriptionService()
    logger = makeLogger()
    createIdea = createCreateIdea(repository, subscriptionService, logger)
    vi.mocked(repository.countByUserId).mockResolvedValue(0)
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockResolvedValue(undefined)
    vi.mocked(repository.createWithInitialVersion).mockResolvedValue(makeIdea())
    vi.mocked(repository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('counts existing ideas for the user before creating', async () => {
    vi.mocked(repository.countByUserId).mockResolvedValue(0)

    await createIdea({ userId: 'user-001', title: 'Test Idea', description: null })

    expect(repository.countByUserId).toHaveBeenCalledWith('user-001')
  })

  it('passes the current idea count to assertCanCreateBusinessIdea', async () => {
    vi.mocked(repository.countByUserId).mockResolvedValue(2)

    await createIdea({ userId: 'user-001', title: 'Test Idea', description: null })

    expect(subscriptionService.assertCanCreateBusinessIdea).toHaveBeenCalledWith('user-001', 2)
  })

  it('creates the idea with the provided input', async () => {
    await createIdea({
      userId: 'user-001',
      title: 'Test Idea',
      description: 'A description'
    })

    expect(repository.createWithInitialVersion).toHaveBeenCalledWith({
      userId: 'user-001',
      title: 'Test Idea',
      description: 'A description'
    })
  })

  it('creates the idea with null description when description is null', async () => {
    await createIdea({ userId: 'user-001', title: 'Test Idea', description: null })

    expect(repository.createWithInitialVersion).toHaveBeenCalledWith({
      userId: 'user-001',
      title: 'Test Idea',
      description: null
    })
  })

  it('returns the created idea', async () => {
    const idea = makeIdea({
      id: 'idea-xyz'
    })
    vi.mocked(repository.createWithInitialVersion).mockResolvedValue(idea)

    const result = await createIdea({ userId: 'user-001', title: 'My Idea', description: null })

    expect(result).toEqual(idea)
  })

  it('logs a debug message after successful creation', async () => {
    vi.mocked(repository.createWithInitialVersion).mockResolvedValue(makeIdea({ id: 'idea-xyz' }))

    await createIdea({ userId: 'user-001', title: 'Test Idea', description: null })

    expect(logger.debug).toHaveBeenCalledWith('Idea created', {
      userId: 'user-001',
      ideaId: 'idea-xyz'
    })
  })

  it('throws when atomic idea creation fails', async () => {
    vi.mocked(repository.createWithInitialVersion).mockRejectedValue(new Error('create failed'))

    await expect(
      createIdea({ userId: 'user-001', title: 'Test Idea', description: null })
    ).rejects.toThrow('create failed')
  })

  it('throws SubscriptionLimitExceededError when subscription limit is reached', async () => {
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockRejectedValue(
      new SubscriptionLimitExceededError()
    )

    await expect(
      createIdea({ userId: 'user-001', title: 'Test Idea', description: null })
    ).rejects.toThrow(SubscriptionLimitExceededError)
  })

  it('does not create an idea when the subscription limit is exceeded', async () => {
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockRejectedValue(
      new SubscriptionLimitExceededError()
    )

    await expect(
      createIdea({ userId: 'user-001', title: 'Test Idea', description: null })
    ).rejects.toThrow()

    expect(repository.createWithInitialVersion).not.toHaveBeenCalled()
  })
})
