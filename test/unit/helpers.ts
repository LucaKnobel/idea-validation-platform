import { vi } from 'vitest'
import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement } from '@application/models/canvas-element'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { HypothesisCanvasSection } from '@application/models/hypothesis-canvas-section'
import type { SubscriptionService } from '@application/interfaces/subscription-service'
import type { Logger } from '@interfaces/logger'

export const VALID_USER_ID = 'user-001'
export const VALID_IDEA_ID = 'idea-001'
export const VALID_IDEA_VERSION_ID = 'idea-version-001'
export const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
export const VALID_ISO_DATETIME = '2026-05-30T12:34:56.000Z'

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
  createdAt: new Date(VALID_ISO_DATETIME),
  updatedAt: new Date(VALID_ISO_DATETIME),
  ...overrides
})

export const makeCanvasRepository = (): CanvasRepository => ({
  getByIdeaVersionForUser: vi.fn(),
  replaceByIdeaVersionForUser: vi.fn()
})

export const makeHypothesisCanvasSection = (
  overrides: Partial<HypothesisCanvasSection> = {}
): HypothesisCanvasSection => ({
  id: 'hypothesis-canvas-section-001',
  hypothesisId: 'hypothesis-001',
  canvasElementType: 'KEY_PARTNERS',
  createdAt: new Date(VALID_ISO_DATETIME),
  updatedAt: new Date(VALID_ISO_DATETIME),
  ...overrides
})

export const makeHypothesis = (overrides: Partial<Hypothesis> = {}): Hypothesis => ({
  id: 'hypothesis-001',
  ideaVersionId: VALID_IDEA_VERSION_ID,
  statement: 'Test hypothesis',
  dimension: 'PROBLEM',
  priority: 'HIGH',
  canvasSectionLinks: [makeHypothesisCanvasSection()],
  createdAt: new Date(VALID_ISO_DATETIME),
  updatedAt: new Date(VALID_ISO_DATETIME),
  ...overrides
})

export const makeHypothesisRepository = (): HypothesisRepository => ({
  listByIdeaVersionForUser: vi.fn(),
  createForIdeaVersion: vi.fn(),
  updateByIdForUser: vi.fn(),
  deleteByIdForUser: vi.fn()
})
