import { vi } from 'vitest'
import type { Idea } from '@application/models/idea'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

export const makeIdea = (overrides: Partial<Idea> = {}): Idea => ({
  id: 'idea-001',
  userId: 'user-001',
  title: 'Test Idea',
  description: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides
})

export const makeIdeaRepository = (): IdeaRepository => ({
  countByUserId: vi.fn(),
  create: vi.fn(),
  deleteByIdForUser: vi.fn(),
  listByUserId: vi.fn()
})

export const makeSubscriptionService = (): SubscriptionService => ({
  getByUserId: vi.fn(),
  isPro: vi.fn(),
  getBusinessIdeaLimit: vi.fn(),
  createFreeSubscription: vi.fn(),
  assertCanCreateBusinessIdea: vi.fn()
})

export const makeLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
})
