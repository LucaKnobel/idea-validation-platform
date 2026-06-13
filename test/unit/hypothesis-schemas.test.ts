import { describe, expect, it } from 'vitest'
import {
  HypothesisCanvasElementTypeSchema,
  HypothesisDimensionSchema,
  HypothesisEvidenceTypeSchema,
  HypothesisPrioritySchema,
  HypothesisResponseSchema,
  HypothesisStatusSchema,
  HypothesesListResponseSchema,
  UpsertHypothesisBodySchema
} from '@infrastructure/validation/hypothesis-schemas'
import {
  HypothesisIdRouteParamsSchema,
  IdeaVersionIdRouteParamsSchema
} from '@infrastructure/validation/route-params-schemas'
import { canvasElementTypes } from '@application/models/canvas-element'
import { hypothesisDimensions, hypothesisEvidenceTypes, hypothesisPriorities } from '@application/models/hypothesis'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Hypothesis route schemas', () => {
  it('accepts canonical list params by version', () => {
    expect(IdeaVersionIdRouteParamsSchema.safeParse({
      versionId: VALID_UUID
    }).success).toBe(true)
  })

  it('accepts canonical detail params by hypothesis id', () => {
    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid canonical params', () => {
    expect(IdeaVersionIdRouteParamsSchema.safeParse({
      versionId: 'not-a-uuid'
    }).success).toBe(false)

    expect(HypothesisIdRouteParamsSchema.safeParse({
      hypothesisId: 'not-a-uuid'
    }).success).toBe(false)
  })
})

describe('Hypothesis enum schemas', () => {
  it('accepts every supported dimension', () => {
    for (const dimension of hypothesisDimensions) {
      expect(HypothesisDimensionSchema.safeParse(dimension).success).toBe(true)
    }
  })

  it('accepts every supported priority', () => {
    for (const priority of hypothesisPriorities) {
      expect(HypothesisPrioritySchema.safeParse(priority).success).toBe(true)
    }
  })

  it('accepts every supported evidence type', () => {
    for (const evidenceType of hypothesisEvidenceTypes) {
      expect(HypothesisEvidenceTypeSchema.safeParse(evidenceType).success).toBe(true)
    }
  })

  it('accepts supported status values', () => {
    for (const status of ['NOT_TESTED', 'VALIDATED', 'INVALIDATED'] as const) {
      expect(HypothesisStatusSchema.safeParse(status).success).toBe(true)
    }
  })

  it('accepts every supported canvas section type', () => {
    for (const canvasElementType of canvasElementTypes) {
      expect(HypothesisCanvasElementTypeSchema.safeParse(canvasElementType).success).toBe(true)
    }
  })
})

describe('Hypothesis body schemas', () => {
  const validBody = {
    statement: '  Validate our channel assumptions  ',
    dimension: 'PROBLEM' as const,
    priority: 'MEDIUM' as const,
    evidenceType: 'QUALITATIVE' as const,
    canvasElementTypes: ['CHANNELS', 'VALUE_PROPOSITIONS'] as const
  }

  it('accepts and trims valid upsert input', () => {
    const result = UpsertHypothesisBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.statement).toBe('Validate our channel assumptions')
    }
  })

  it('deduplicates canvasElementTypes in upsert input', () => {
    const result = UpsertHypothesisBodySchema.safeParse({
      ...validBody,
      canvasElementTypes: ['CHANNELS', 'CHANNELS', 'VALUE_PROPOSITIONS']
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.canvasElementTypes).toEqual(['CHANNELS', 'VALUE_PROPOSITIONS'])
    }
  })

  it('rejects empty statements after trimming', () => {
    expect(UpsertHypothesisBodySchema.safeParse({
      ...validBody,
      statement: '   '
    }).success).toBe(false)
  })

  it('rejects empty canvasElementTypes arrays', () => {
    expect(UpsertHypothesisBodySchema.safeParse({
      ...validBody,
      canvasElementTypes: []
    }).success).toBe(false)
  })

  it('accepts a valid upsert body', () => {
    expect(UpsertHypothesisBodySchema.safeParse(validBody).success).toBe(true)
  })
})

describe('Hypothesis response schemas', () => {
  const validResponse = {
    id: VALID_UUID,
    ideaVersionId: VALID_UUID,
    statement: 'Validate distribution',
    dimension: 'MARKET' as const,
    priority: 'LOW' as const,
    evidenceType: 'QUALITATIVE' as const,
    status: 'NOT_TESTED' as const,
    canvasSections: ['CHANNELS'] as const,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid hypothesis response', () => {
    expect(HypothesisResponseSchema.safeParse(validResponse).success).toBe(true)
  })

  it('accepts a valid hypotheses list response', () => {
    expect(HypothesesListResponseSchema.safeParse({ items: [validResponse] }).success).toBe(true)
  })

  it('rejects invalid timestamps in hypothesis response', () => {
    expect(HypothesisResponseSchema.safeParse({
      ...validResponse,
      updatedAt: 'not-a-date'
    }).success).toBe(false)
  })
})
