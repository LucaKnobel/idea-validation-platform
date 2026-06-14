import { describe, expect, it } from 'vitest'
import {
  MeasurementResponseSchema,
  UpsertMeasurementBodySchema
} from '@infrastructure/validation/measurement-schemas'
import { HypothesisIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Measurement route schemas', () => {
  it('accepts canonical singleton measurement params', () => {
    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid hypothesis ids', () => {
    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: 'not-a-uuid'
    }).success).toBe(false)
  })
})

describe('Measurement body schemas', () => {
  const validUpsertBody = {
    value: 42.5,
    note: '  Baseline from first experiment run.  '
  }

  it('accepts and normalizes valid upsert input', () => {
    const result = UpsertMeasurementBodySchema.safeParse(validUpsertBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBe('Baseline from first experiment run.')
    }
  })

  it('rejects non-finite values', () => {
    expect(UpsertMeasurementBodySchema.safeParse({
      ...validUpsertBody,
      value: Number.NaN
    }).success).toBe(false)
  })

  it('normalizes empty notes to null', () => {
    const result = UpsertMeasurementBodySchema.safeParse({
      ...validUpsertBody,
      note: '   '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.note).toBeNull()
    }
  })

  it('accepts a valid upsert body', () => {
    expect(UpsertMeasurementBodySchema.safeParse(validUpsertBody).success).toBe(true)
  })
})

describe('Measurement response schemas', () => {
  const validMeasurementResponse = {
    id: VALID_UUID,
    value: 10,
    note: 'Collected after campaign launch.',
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid measurement response', () => {
    expect(MeasurementResponseSchema.safeParse(validMeasurementResponse).success).toBe(true)
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
