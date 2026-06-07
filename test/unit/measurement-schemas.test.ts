import { describe, expect, it } from 'vitest'
import {
  CreateMeasurementBodySchema,
  MeasurementCollectionRouteParamsSchema,
  MeasurementResponseSchema,
  MeasurementRouteParamsSchema,
  MeasurementsListResponseSchema,
  UpdateMeasurementBodySchema
} from '@infrastructure/validation/measurement-schemas'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Measurement route schemas', () => {
  it('accepts valid measurement collection params', () => {
    expect(MeasurementCollectionRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      experimentId: VALID_UUID
    }).success).toBe(true)
  })

  it('accepts valid measurement route params including measurementId', () => {
    expect(MeasurementRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      experimentId: VALID_UUID,
      measurementId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid route identifiers', () => {
    expect(MeasurementRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID,
      experimentId: 'not-a-uuid',
      measurementId: VALID_UUID
    }).success).toBe(false)
  })
})

describe('CreateMeasurementBodySchema', () => {
  const validBody = {
    metricId: VALID_UUID,
    value: 42.5,
    note: '  Baseline from first experiment run.  '
  }

  it('accepts and normalizes valid input', () => {
    const result = CreateMeasurementBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBe('Baseline from first experiment run.')
    }
  })

  it('rejects invalid metric ids', () => {
    expect(CreateMeasurementBodySchema.safeParse({
      ...validBody,
      metricId: 'not-a-uuid'
    }).success).toBe(false)
  })

  it('rejects non-finite values', () => {
    expect(CreateMeasurementBodySchema.safeParse({
      ...validBody,
      value: Number.NaN
    }).success).toBe(false)
  })

  it('normalizes empty notes to null', () => {
    const result = CreateMeasurementBodySchema.safeParse({
      ...validBody,
      note: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBeNull()
    }
  })
})

describe('UpdateMeasurementBodySchema', () => {
  it('shares the same validation rules as the create schema', () => {
    expect(UpdateMeasurementBodySchema.safeParse({
      metricId: VALID_UUID,
      value: 0,
      note: null
    }).success).toBe(true)
  })
})

describe('Measurement response schemas', () => {
  const validMeasurementResponse = {
    id: VALID_UUID,
    experimentId: VALID_UUID,
    metricId: VALID_UUID,
    value: 10,
    note: 'Collected after campaign launch.',
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid measurement response', () => {
    expect(MeasurementResponseSchema.safeParse(validMeasurementResponse).success).toBe(true)
  })

  it('accepts a valid measurements list response', () => {
    expect(MeasurementsListResponseSchema.safeParse({ items: [validMeasurementResponse] }).success).toBe(true)
  })

  it('accepts responses without notes', () => {
    expect(MeasurementResponseSchema.safeParse({
      ...validMeasurementResponse,
      note: null
    }).success).toBe(true)
  })

  it('rejects invalid timestamps in responses', () => {
    expect(MeasurementResponseSchema.safeParse({
      ...validMeasurementResponse,
      updatedAt: 'not-a-date'
    }).success).toBe(false)
  })
})
