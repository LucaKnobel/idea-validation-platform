import { describe, expect, it } from 'vitest'
import {
  CreateMetricBodySchema,
  MetricCollectionRouteParamsSchema,
  MetricResponseSchema,
  MetricRouteParamsSchema,
  MetricThresholdInputSchema,
  MetricThresholdResponseSchema,
  MetricsListResponseSchema,
  ThresholdOperatorSchema,
  UpdateMetricBodySchema
} from '@infrastructure/validation/metric-schemas'
import { thresholdOperators } from '@application/models/metric-threshold'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Metric route schemas', () => {
  it('accepts valid metric collection params', () => {
    expect(MetricCollectionRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID
    }).success).toBe(true)
  })

  it('accepts valid metric route params including metricId', () => {
    expect(MetricRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      metricId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid route identifiers', () => {
    expect(MetricRouteParamsSchema.safeParse({
      id: 'not-a-uuid',
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      metricId: VALID_UUID
    }).success).toBe(false)
  })
})

describe('Metric threshold input schema', () => {
  it('accepts every supported threshold operator', () => {
    for (const operator of thresholdOperators) {
      expect(ThresholdOperatorSchema.safeParse(operator).success).toBe(true)
      expect(MetricThresholdInputSchema.safeParse({ operator, referenceValue: 10 }).success).toBe(true)
    }
  })

  it('rejects unsupported threshold operators', () => {
    expect(ThresholdOperatorSchema.safeParse('NOT_AN_OPERATOR').success).toBe(false)
  })

  it('rejects non-finite reference values', () => {
    expect(MetricThresholdInputSchema.safeParse({
      operator: 'GTE',
      referenceValue: Number.NaN
    }).success).toBe(false)
  })
})

describe('CreateMetricBodySchema', () => {
  const validBody = {
    name: '  Conversion Rate  ',
    description: '  Measures sign-up conversion.  ',
    unit: ' % ',
    threshold: {
      operator: 'GTE' as const,
      referenceValue: 10
    }
  }

  it('accepts and normalizes valid input', () => {
    const result = CreateMetricBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Conversion Rate')
      expect(result.data.description).toBe('Measures sign-up conversion.')
      expect(result.data.unit).toBe('%')
    }
  })

  it('rejects empty names after trimming', () => {
    expect(CreateMetricBodySchema.safeParse({
      ...validBody,
      name: '   '
    }).success).toBe(false)
  })

  it('normalizes empty optional text fields to null', () => {
    const result = CreateMetricBodySchema.safeParse({
      ...validBody,
      description: '   ',
      unit: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeNull()
      expect(result.data.unit).toBeNull()
    }
  })
})

describe('UpdateMetricBodySchema', () => {
  it('shares the same validation rules as the create schema', () => {
    expect(UpdateMetricBodySchema.safeParse({
      name: 'Interview Count',
      description: null,
      unit: null,
      threshold: {
        operator: 'GTE',
        referenceValue: 5
      }
    }).success).toBe(true)
  })
})

describe('Metric response schemas', () => {
  const validThresholdResponse = {
    id: VALID_UUID,
    metricId: VALID_UUID,
    operator: 'GTE' as const,
    referenceValue: 10,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  const validMetricResponse = {
    id: VALID_UUID,
    hypothesisId: VALID_UUID,
    name: 'Conversion Rate',
    description: 'Measures sign-up conversion.',
    unit: '%',
    threshold: validThresholdResponse,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid metric threshold response', () => {
    expect(MetricThresholdResponseSchema.safeParse(validThresholdResponse).success).toBe(true)
  })

  it('accepts a valid metric response', () => {
    expect(MetricResponseSchema.safeParse(validMetricResponse).success).toBe(true)
  })

  it('accepts metric responses without threshold', () => {
    expect(MetricResponseSchema.safeParse({
      ...validMetricResponse,
      threshold: null
    }).success).toBe(true)
  })

  it('accepts a valid metric list response', () => {
    expect(MetricsListResponseSchema.safeParse({ items: [validMetricResponse] }).success).toBe(true)
  })
})
