import { vi } from 'vitest'
import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement } from '@application/models/canvas-element'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

export const VALID_USER_ID = 'user-001'
export const VALID_IDEA_ID = 'idea-001'
export const VALID_IDEA_VERSION_ID = 'idea-version-001'

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

export const makeCanvasElement = (overrides: Partial<CanvasElement> = {}): CanvasElement => ({
  id: 'canvas-element-001',
  ideaVersionId: VALID_IDEA_VERSION_ID,
  type: 'KEY_PARTNERS',
  content: 'Strategic supplier',
  createdAt: new Date('2026-05-30T12:34:56.000Z'),
  updatedAt: new Date('2026-05-30T12:34:56.000Z'),
  ...overrides
})

export const makeCanvasRepository = (): CanvasRepository => ({
  getByIdeaVersionForUser: vi.fn(),
  replaceByIdeaVersionForUser: vi.fn()
})
