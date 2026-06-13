import { describe, expect, it } from 'vitest'
import {
  CreateHypothesisBodySchema,
  HypothesisCanvasElementTypeSchema,
  HypothesisCanvasSectionResponseSchema,
  HypothesisDimensionSchema,
  HypothesisPrioritySchema,
  HypothesisResponseSchema,
  HypothesisRouteParamsSchema,
  HypothesisVersionRouteParamsSchema,
  HypothesesListResponseSchema,
  UpdateHypothesisBodySchema
} from '@infrastructure/validation/hypothesis-schemas'
import { canvasElementTypes } from '@application/models/canvas-element'
import { hypothesisDimensions, hypothesisPriorities } from '@application/models/hypothesis'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('HypothesisVersionRouteParamsSchema', () => {
  it('accepts valid route params', () => {
    const result = HypothesisVersionRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid identifiers', () => {
    const result = HypothesisVersionRouteParamsSchema.safeParse({
      id: 'not-a-uuid',
      versionId: VALID_UUID
    })

    expect(result.success).toBe(false)
  })
})

describe('HypothesisRouteParamsSchema', () => {
  it('accepts valid route params including hypothesis id', () => {
    const result = HypothesisRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID,
      hypothesisId: VALID_UUID
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing hypothesis id', () => {
    const result = HypothesisRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID
    })

    expect(result.success).toBe(false)
  })
})

describe('Hypothesis dimension, priority and canvas schemas', () => {
  it('accepts every supported dimension', () => {
    for (const dimension of hypothesisDimensions) {
      expect(HypothesisDimensionSchema.safeParse(dimension).success).toBe(true)
    }
  })

  it('rejects unsupported dimensions', () => {
    expect(HypothesisDimensionSchema.safeParse('NOT_A_DIMENSION').success).toBe(false)
  })

  it('accepts every supported priority', () => {
    for (const priority of hypothesisPriorities) {
      expect(HypothesisPrioritySchema.safeParse(priority).success).toBe(true)
    }
  })

  it('rejects unsupported priorities', () => {
    expect(HypothesisPrioritySchema.safeParse('NOT_A_PRIORITY').success).toBe(false)
  })

  it('accepts every supported canvas element type', () => {
    for (const canvasElementType of canvasElementTypes) {
      expect(HypothesisCanvasElementTypeSchema.safeParse(canvasElementType).success).toBe(true)
    }
  })

  it('rejects unsupported canvas element types', () => {
    expect(HypothesisCanvasElementTypeSchema.safeParse('NOT_A_CANVAS_SECTION').success).toBe(false)
  })
})

describe('CreateHypothesisBodySchema', () => {
  const validBody = {
    statement: '  Validate our channel assumptions  ',
    dimension: 'PROBLEM' as const,
    priority: 'MEDIUM' as const,
    evidenceType: 'QUALITATIVE' as const,
    canvasSectionTypes: ['CHANNELS', 'VALUE_PROPOSITIONS'] as const
  }

  it('accepts and trims valid input', () => {
    const result = CreateHypothesisBodySchema.safeParse(validBody)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.statement).toBe('Validate our channel assumptions')
    }
  })

  it('rejects empty statements after trimming', () => {
    const result = CreateHypothesisBodySchema.safeParse({
      ...validBody,
      statement: '   '
    })

    expect(result.success).toBe(false)
  })

  it('rejects statements longer than 3000 characters', () => {
    const result = CreateHypothesisBodySchema.safeParse({
      ...validBody,
      statement: 'A'.repeat(3001)
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty canvasSectionTypes arrays', () => {
    const result = CreateHypothesisBodySchema.safeParse({
      ...validBody,
      canvasSectionTypes: []
    })

    expect(result.success).toBe(false)
  })

  it('rejects more than nine canvas section types', () => {
    const result = CreateHypothesisBodySchema.safeParse({
      ...validBody,
      canvasSectionTypes: Array.from({ length: 10 }, () => 'CHANNELS')
    })

    expect(result.success).toBe(false)
  })

  it('rejects unsupported canvas section types inside the array', () => {
    const result = CreateHypothesisBodySchema.safeParse({
      ...validBody,
      canvasSectionTypes: ['CHANNELS', 'NOT_A_CANVAS_SECTION']
    })

    expect(result.success).toBe(false)
  })
})

describe('UpdateHypothesisBodySchema', () => {
  it('shares the same validation rules as the create schema', () => {
    const result = UpdateHypothesisBodySchema.safeParse({
      statement: 'Validate the idea',
      dimension: 'SOLUTION',
      priority: 'HIGH',
      canvasSectionTypes: ['KEY_PARTNERS']
    })

    expect(result.success).toBe(true)
  })
})

describe('Hypothesis response schemas', () => {
  const validSectionLink = {
    id: VALID_UUID,
    hypothesisId: VALID_UUID,
    canvasElementType: 'CHANNELS' as const,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  const validResponse = {
    id: VALID_UUID,
    ideaVersionId: VALID_UUID,
    statement: 'Validate distribution',
    dimension: 'MARKET' as const,
    priority: 'LOW' as const,
    canvasSectionLinks: [validSectionLink],
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid hypothesis canvas section response', () => {
    expect(HypothesisCanvasSectionResponseSchema.safeParse(validSectionLink).success).toBe(true)
  })

  it('rejects invalid timestamps in section responses', () => {
    expect(HypothesisCanvasSectionResponseSchema.safeParse({
      ...validSectionLink,
      createdAt: 'not-a-date'
    }).success).toBe(false)
  })

  it('accepts a valid hypothesis response', () => {
    expect(HypothesisResponseSchema.safeParse(validResponse).success).toBe(true)
  })

  it('rejects invalid nested response timestamps', () => {
    expect(HypothesisResponseSchema.safeParse({
      ...validResponse,
      canvasSectionLinks: [
        {
          ...validSectionLink,
          updatedAt: 'not-a-date'
        }
      ]
    }).success).toBe(false)
  })

  it('accepts a valid hypotheses list response', () => {
    expect(HypothesesListResponseSchema.safeParse({ items: [validResponse] }).success).toBe(true)
  })
})
