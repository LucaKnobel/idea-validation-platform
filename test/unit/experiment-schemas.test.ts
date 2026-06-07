import { describe, expect, it } from 'vitest'
import {
  CreateExperimentBodySchema,
  ExperimentCollectionRouteParamsSchema,
  ExperimentResponseSchema,
  ExperimentRouteParamsSchema,
  ExperimentStatusSchema,
  ExperimentsListResponseSchema,
  UpdateExperimentBodySchema
} from '@infrastructure/validation/experiment-schemas'
import { experimentStatuses } from '@application/models/experiment'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Experiment route schemas', () => {
  it('accepts valid experiment collection params', () => {
    expect(ExperimentCollectionRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID
    }).success).toBe(true)
  })

  it('accepts valid experiment route params including experimentId', () => {
    expect(ExperimentRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      experimentId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid route identifiers', () => {
    expect(ExperimentRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: 'not-a-uuid',
      hypothesisId: VALID_UUID,
      experimentId: VALID_UUID
    }).success).toBe(false)
  })
})

describe('Experiment enum schemas', () => {
  it('accepts every supported experiment status', () => {
    for (const status of experimentStatuses) {
      expect(ExperimentStatusSchema.safeParse(status).success).toBe(true)
    }
  })

  it('rejects unsupported experiment statuses', () => {
    expect(ExperimentStatusSchema.safeParse('NOT_A_STATUS').success).toBe(false)
  })
})

describe('CreateExperimentBodySchema', () => {
  const validBody = {
    title: '  Landing page test  ',
    description: '  A/B test for onboarding headline.  ',
    status: 'PLANNED' as const
  }

  it('accepts and normalizes valid input', () => {
    const result = CreateExperimentBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Landing page test')
      expect(result.data.description).toBe('A/B test for onboarding headline.')
    }
  })

  it('rejects empty titles after trimming', () => {
    expect(CreateExperimentBodySchema.safeParse({
      ...validBody,
      title: '   '
    }).success).toBe(false)
  })

  it('normalizes empty optional text fields to null', () => {
    const result = CreateExperimentBodySchema.safeParse({
      ...validBody,
      description: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
    }
  })
})

describe('UpdateExperimentBodySchema', () => {
  it('shares the same validation rules as the create schema', () => {
    expect(UpdateExperimentBodySchema.safeParse({
      title: 'Follow-up interviews',
      description: null,
      status: 'RUNNING'
    }).success).toBe(true)
  })
})

describe('Experiment response schemas', () => {
  const validExperimentResponse = {
    id: VALID_UUID,
    hypothesisId: VALID_UUID,
    title: 'Landing page test',
    description: 'A/B test for onboarding headline.',
    status: 'COMPLETED' as const,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid experiment response', () => {
    expect(ExperimentResponseSchema.safeParse(validExperimentResponse).success).toBe(true)
  })

  it('accepts a valid experiments list response', () => {
    expect(ExperimentsListResponseSchema.safeParse({ items: [validExperimentResponse] }).success).toBe(true)
  })

  it('rejects invalid timestamps in responses', () => {
    expect(ExperimentResponseSchema.safeParse({
      ...validExperimentResponse,
      createdAt: 'not-a-date'
    }).success).toBe(false)
  })
})
