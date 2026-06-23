import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SubscriptionRepository } from '@application/interfaces/subscription-repository'
import type { SubscriptionAccessService } from '@application/interfaces/subscription-access-service'
import type { Logger } from '@interfaces/logger'
import type { Subscription } from '@application/models/subscription'
import { buildSubscriptionProvisioningService } from '@application/services/build-subscription-provisioning-service'

describe('buildSubscriptionProvisioningService', () => {
  let mockRepository: SubscriptionRepository
  let mockAccessService: SubscriptionAccessService
  let mockLogger: Logger
  let service: ReturnType<typeof buildSubscriptionProvisioningService>

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

    mockAccessService = {
      getByUserId: vi.fn(),
      getStatusSnapshot: vi.fn(),
      isPro: vi.fn(),
      getBusinessIdeaLimit: vi.fn(),
      assertCanCreateBusinessIdea: vi.fn()
    }

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      trace: vi.fn()
    }

    service = buildSubscriptionProvisioningService(mockRepository, mockAccessService, mockLogger)
  })

  describe('createFreeSubscription', () => {
    it('creates and returns free subscription when none exists', async () => {
      vi.mocked(mockAccessService.getByUserId).mockResolvedValue(null)

      const newSubscription = createMockSubscription({ userId: 'new-user-id' })
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
        source: 'subscription-provisioning-service',
        event: 'subscription.free_created',
        userId: 'new-user-id'
      })
    })

    it('returns existing subscription without creating a duplicate', async () => {
      const existing = createMockSubscription({ userId: 'existing-user-id', plan: 'PRO', status: 'ACTIVE' })
      vi.mocked(mockAccessService.getByUserId).mockResolvedValue(existing)

      const result = await service.createFreeSubscription('existing-user-id')

      expect(result).toEqual(existing)
      expect(mockRepository.create).not.toHaveBeenCalled()
      expect(mockLogger.info).not.toHaveBeenCalled()
    })

    it('logs debug when subscription already exists', async () => {
      const existing = createMockSubscription({ userId: 'existing-user-id' })
      vi.mocked(mockAccessService.getByUserId).mockResolvedValue(existing)

      await service.createFreeSubscription('existing-user-id')

      expect(mockLogger.debug).toHaveBeenCalledWith('Free subscription already exists (idempotent)', {
        source: 'subscription-provisioning-service',
        event: 'subscription.free_already_exists',
        userId: 'existing-user-id'
      })
    })

    it('uses access service for lookup, not repository directly', async () => {
      const existing = createMockSubscription()
      vi.mocked(mockAccessService.getByUserId).mockResolvedValue(existing)

      await service.createFreeSubscription('test-user-id')

      expect(mockAccessService.getByUserId).toHaveBeenCalledWith('test-user-id')
      expect(mockRepository.findByUserId).not.toHaveBeenCalled()
    })
  })
})
