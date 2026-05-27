import { vi } from 'vitest'
import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

export const makeIdea = (overrides: Partial<Idea> = {}): Idea => ({
  id: 'idea-001',
  userId: 'user-001',
  versions: [makeIdeaVersion()],
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides
})

export const makeIdeaVersion = (overrides: Partial<IdeaVersion> = {}): IdeaVersion => ({
  id: 'idea-version-001',
  ideaId: 'idea-001',
  versionNumber: 1,
  type: 'INITIAL',
  title: 'Test Idea',
  description: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  ...overrides
})

export const makeIdeaRepository = (): IdeaRepository => ({
  countByUserId: vi.fn(),
  createWithInitialVersion: vi.fn(),
  deleteByIdForUser: vi.fn()
})

export const makeIdeaVersionRepository = (): IdeaVersionRepository => ({
  listIdeasByUser: vi.fn()
})

export const makeSubscriptionService = (): SubscriptionService => ({
  getByUserId: vi.fn(),
  isPro: vi.fn(),
  getBusinessIdeaLimit: vi.fn(),
  createFreeSubscription: vi.fn(),
  assertCanCreateBusinessIdea: vi.fn()
})

export const makeLogger = (): Logger => ({
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
})
