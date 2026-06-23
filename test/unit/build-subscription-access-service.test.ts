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
      findByProviderSubscriptionId: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    }

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn()
    }

    service = buildSubscriptionAccessService(mockRepository, mockLogger)
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

  describe('getStatusSnapshot', () => {
    it('returns subscription and isPro=true for active PRO subscription', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getStatusSnapshot('test-user-id')

      expect(result).toEqual({
        subscription,
        isPro: true
      })
    })

    it('returns subscription and isPro=false for cancelled PRO subscription', async () => {
      const subscription = createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(subscription)

      const result = await service.getStatusSnapshot('test-user-id')

      expect(result).toEqual({
        subscription,
        isPro: false
      })
    })

    it('returns null subscription and isPro=false when no subscription exists', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const result = await service.getStatusSnapshot('test-user-id')

      expect(result).toEqual({
        subscription: null,
        isPro: false
      })
    })
  })

  describe('isPro', () => {
    it('returns false when subscription does not exist', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      const result = await service.isPro('test-user-id')

      expect(result).toBe(false)
    })

    it('returns false for FREE plan', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'FREE', status: 'ACTIVE' })
      )

      expect(await service.isPro('test-user-id')).toBe(false)
    })

    it('returns true for PRO plan with ACTIVE status', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      )

      expect(await service.isPro('test-user-id')).toBe(true)
    })

    it('returns false for PRO plan with CANCELLED status', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      )

      expect(await service.isPro('test-user-id')).toBe(false)
    })
  })

  describe('getBusinessIdeaLimit', () => {
    it('returns 1 for FREE plan users', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'FREE' })
      )

      expect(await service.getBusinessIdeaLimit('test-user-id')).toBe(1)
    })

    it('returns Infinity for PRO plan users', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      )

      expect(await service.getBusinessIdeaLimit('test-user-id')).toBe(Number.POSITIVE_INFINITY)
    })

    it('returns 1 for users without subscription', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(null)

      expect(await service.getBusinessIdeaLimit('test-user-id')).toBe(1)
    })

    it('returns 1 for PRO users with CANCELLED status', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      )

      expect(await service.getBusinessIdeaLimit('test-user-id')).toBe(1)
    })
  })

  describe('assertCanCreateBusinessIdea', () => {
    it('allows creation for FREE user with 0 existing ideas', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'FREE' })
      )

      await expect(service.assertCanCreateBusinessIdea('test-user-id', 0)).resolves.not.toThrow()
    })

    it('blocks creation for FREE user at limit', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'FREE' })
      )

      await expect(service.assertCanCreateBusinessIdea('test-user-id', 1)).rejects.toThrow(SubscriptionLimitExceededError)

      expect(mockLogger.warn).toHaveBeenCalledWith('Business idea limit exceeded', {
        source: 'subscription-access-service',
        event: 'subscription.limit_exceeded',
        userId: 'test-user-id',
        currentIdeas: 1,
        limit: 1
      })
    })

    it('allows unlimited creation for PRO user', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'ACTIVE' })
      )

      await expect(service.assertCanCreateBusinessIdea('test-user-id', 1000)).resolves.not.toThrow()
    })

    it('blocks creation for CANCELLED PRO user at FREE limit', async () => {
      vi.mocked(mockRepository.findByUserId).mockResolvedValue(
        createMockSubscription({ plan: 'PRO', status: 'CANCELLED' })
      )

      await expect(service.assertCanCreateBusinessIdea('test-user-id', 1)).rejects.toThrow(SubscriptionLimitExceededError)
    })
  })
})
