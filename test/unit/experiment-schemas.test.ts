import { describe, expect, it } from 'vitest'
import {
  ExperimentResponseSchema,
  ExperimentStatusSchema,
  UpsertExperimentBodySchema
} from '@infrastructure/validation/experiment-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import { experimentStatuses } from '@application/models/experiment'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Experiment route schemas', () => {
  it('accepts canonical singleton experiment params', () => {
    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid hypothesis identifiers', () => {
    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: 'not-a-uuid'
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

describe('Experiment body schemas', () => {
  const validBody = {
    title: '  Landing page test  ',
    description: '  A/B test for onboarding headline.  ',
    status: 'PLANNED' as const
  }

  it('accepts and normalizes valid upsert input', () => {
    const result = UpsertExperimentBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Landing page test')
      expect(result.data.description).toBe('A/B test for onboarding headline.')
    }
  })

  it('rejects empty titles after trimming', () => {
    expect(UpsertExperimentBodySchema.safeParse({
      ...validBody,
      title: '   '
    }).success).toBe(false)
  })

  it('normalizes empty optional text fields to null', () => {
    const result = UpsertExperimentBodySchema.safeParse({
      ...validBody,
      description: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
    }
  })

  it('accepts a valid upsert body', () => {
    expect(UpsertExperimentBodySchema.safeParse(validBody).success).toBe(true)
  })
})

describe('Experiment response schemas', () => {
  const validExperimentResponse = {
    id: VALID_UUID,
    title: 'Landing page test',
    description: 'A/B test for onboarding headline.',
    status: 'COMPLETED' as const,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid experiment response', () => {
    expect(ExperimentResponseSchema.safeParse(validExperimentResponse).success).toBe(true)
  })

  it('rejects invalid timestamps in responses', () => {
    expect(ExperimentResponseSchema.safeParse({
      ...validExperimentResponse,
      createdAt: 'not-a-date'
    }).success).toBe(false)
  })
})
