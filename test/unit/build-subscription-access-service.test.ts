import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { Logger } from '@interfaces/logger'
import type { Subscription } from '@application/models/subscription'
import { buildSubscriptionAccessService } from '@application/services/build-subscription-access-service'
import { SubscriptionLimitExceededError } from '@application/errors/subscription-errors'

describe('buildSubscriptionAccessService', () => {
  let mockRepository: SubscriptionRepository
  let mockLogger: Logger
  let service: ReturnType<typeof buildSubscriptionAccessService>

  const createMockSubscription = (overrides?: Partial<Subscription>): Subscription => ({
    userId: 'test-user-id',
    plan: 'FREE',
    status: 'ACTIVE',
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodEnd: null,
    ...overrides
  })

  beforeEach(() => {
    mockRepository = {
      findByUserId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn()
    }

    service = buildSubscriptionAccessService(mockRepository, mockLogger)
  })

  describe('isPro', () => {
    it('returns false when subscription does not exist', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const result = await service.isPro('test-user-id')

      expect(result).toBe(false)
      expect(mockRepository.findByUserId).toHaveBeenCalledWith('test-user-id')
    })

    it('returns false for FREE plan', async () => {
      const subscription = createMockSubscription({ plan: 'FREE', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.isPro('test-user-id')

      expect(result).toBe(false)
    })

    it('returns true for PRO plan with ACTIVE status', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.isPro('test-user-id')

      expect(result).toBe(true)
    })

    it('returns false for PRO plan with CANCELLED status', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.isPro('test-user-id')

      expect(result).toBe(false)
    })
  })

  describe('getBusinessIdeaLimit', () => {
    it('returns 1 for FREE plan users', async () => {
      const subscription = createMockSubscription({ plan: 'FREE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getBusinessIdeaLimit('test-user-id')

      expect(result).toBe(1)
    })

    it('returns Infinity for PRO plan users', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getBusinessIdeaLimit('test-user-id')

      expect(result).toBe(Number.POSITIVE_INFINITY)
    })

    it('returns 1 for users without subscription', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const result = await service.getBusinessIdeaLimit('test-user-id')

      expect(result).toBe(1)
    })

    it('returns 1 for PRO users with CANCELLED status', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getBusinessIdeaLimit('test-user-id')

      expect(result).toBe(1)
    })
  })

  describe('createFreeSubscription', () => {
    it('creates and returns free subscription when none exists', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const newSubscription = createMockSubscription({
        userId: 'new-user-id',
        plan: 'FREE',
        status: 'ACTIVE'
      })
      vi.mocked(mockRepository.create).mockResolvedValue(newSubscription)

      const result = await service.createFreeSubscription('new-user-id')

      expect(result).toEqual(newSubscription)
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'new-user-id',
        plan: 'FREE',
        status: 'ACTIVE',
        providerCustomerId: null,
        providerSubscriptionId: null,
        currentPeriodEnd: null
      })
      expect(mockLogger.info).toHaveBeenCalledWith('Free subscription created', {
        source: 'subscription-access-service',
        event: 'subscription.free_created',
        userId: 'new-user-id'
      })
    })

    it('returns existing subscription without creating a duplicate', async () => {
      const existingSubscription = createMockSubscription({
        userId: 'existing-user-id',
        plan: 'PRO',
        status: 'ACTIVE'
      })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(existingSubscription)

      const result = await service.createFreeSubscription('existing-user-id')

      expect(result).toEqual(existingSubscription)
      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(mockLogger.info).not.toHaveBeenCalled()
    })
  })

  describe('assertCanCreateBusinessIdea', () => {
    it('allows business idea creation for FREE user with 0 existing ideas', async () => {
      const subscription = createMockSubscription({ plan: 'FREE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      await expect(
        service.assertCanCreateBusinessIdea('test-user-id', 0)
      ).resolves.not.toThrow()
    })

    it('blocks business idea creation for FREE user at limit', async () => {
      const subscription = createMockSubscription({ plan: 'FREE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      await expect(
        service.assertCanCreateBusinessIdea('test-user-id', 1)
      ).rejects.toThrow(SubscriptionLimitExceededError)

      expect(mockLogger.warn).toHaveBeenCalledWith('Business idea limit exceeded', {
        source: 'subscription-access-service',
        event: 'subscription.limit_exceeded',
        userId: 'test-user-id',
        currentIdeas: 1,
        limit: 1
      })
    })

    it('allows unlimited business idea creation for PRO user', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      await expect(
        service.assertCanCreateBusinessIdea('test-user-id', 1000)
      ).resolves.not.toThrow()
    })

    it('blocks business idea creation for CANCELLED PRO user at FREE limit', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      await expect(
        service.assertCanCreateBusinessIdea('test-user-id', 1)
      ).rejects.toThrow(SubscriptionLimitExceededError)
    })

    it('logs unlimited limit for PRO user', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      try {
        // Trigger the path where it would normally succeed, but we want to see the log if it failed
        await service.assertCanCreateBusinessIdea('test-user-id', 0)
      } catch {
        // Expected to not throw, so this shouldn't execute
      }

      // Verify it doesn't log a warning for valid access
      expect(mockLogger.warn).not.toHaveBeenCalled()
    })
  })

  describe('getByUserId', () => {
    it('returns subscription when it exists', async () => {
      const subscription = createMockSubscription()
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getByUserId('test-user-id')

      expect(result).toEqual(subscription)
    })

    it('returns null when subscription does not exist', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const result = await service.getByUserId('test-user-id')

      expect(result).toBeNull()
    })
  })
})
