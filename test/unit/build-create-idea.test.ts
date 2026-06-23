import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCreateIdea } from '@application/services/build-create-idea'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { SubscriptionAccessService } from '@application/interfaces/subscription-access-service'
import type { Logger } from '@interfaces/logger'
import { makeIdea, makeIdeaRepository, makeSubscriptionService, makeLogger, VALID_USER_ID } from './helpers'

describe('buildCreateIdea', () => {
  let repository: IdeaRepository
  let subscriptionService: SubscriptionAccessService
  let logger: Logger
  let createIdea: ReturnType<typeof buildCreateIdea>

  beforeEach(() => {
    repository = makeIdeaRepository()
    subscriptionService = makeSubscriptionService()
    logger = makeLogger()
    createIdea = buildCreateIdea(repository, subscriptionService, logger)
    vi.mocked(repository.countByUser).mockResolvedValue(0)
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockResolvedValue(undefined)
    vi.mocked(repository.create).mockResolvedValue(makeIdea())
  })

  it('counts existing ideas for the user before creating', async () => {
    await createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: null })

    expect(repository.countByUser).toHaveBeenCalledWith(VALID_USER_ID)
  })

  it('passes the current count to assertCanCreateBusinessIdea', async () => {
    vi.mocked(repository.countByUser).mockResolvedValue(2)

    await createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: null })

    expect(subscriptionService.assertCanCreateBusinessIdea).toHaveBeenCalledWith(VALID_USER_ID, 2)
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

  it('throws SubscriptionLimitExceededError when limit is reached', async () => {
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockRejectedValue(
      new SubscriptionLimitExceededError()
    )

    await expect(
      createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: null })
    ).rejects.toThrow(SubscriptionLimitExceededError)
  })

  it('does not create when subscription limit is exceeded', async () => {
    vi.mocked(subscriptionService.assertCanCreateBusinessIdea).mockRejectedValue(
      new SubscriptionLimitExceededError()
    )

    await expect(
      createIdea({ userId: VALID_USER_ID, title: 'Test Idea', description: null })
    ).rejects.toThrow()

    expect(repository.create).not.toHaveBeenCalled()
  })
})
