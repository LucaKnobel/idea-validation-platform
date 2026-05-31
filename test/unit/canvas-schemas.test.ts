import { describe, expect, it } from 'vitest'
import {
  CanvasElementInputSchema,
  CanvasElementResponseSchema,
  CanvasElementTypeSchema,
  CanvasRouteParamsSchema,
  IdeaVersionCanvasResponseSchema,
  ReplaceIdeaVersionCanvasBodySchema
} from '@infrastructure/validation/canvas-schemas'
import { canvasElementTypes } from '@application/models/canvas-element'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('CanvasRouteParamsSchema', () => {
  it('accepts valid route params', () => {
    const result = CanvasRouteParamsSchema.safeParse({
      id: VALID_UUID,
      versionId: VALID_UUID
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid uuid values', () => {
    const result = CanvasRouteParamsSchema.safeParse({
      id: 'not-a-uuid',
      versionId: VALID_UUID
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing versionId', () => {
    const result = CanvasRouteParamsSchema.safeParse({
      id: VALID_UUID
    })

    expect(result.success).toBe(false)
  })
})

describe('CanvasElementTypeSchema', () => {
  it('accepts every supported canvas element type', () => {
    for (const type of canvasElementTypes) {
      const result = CanvasElementTypeSchema.safeParse(type)

      expect(result.success).toBe(true)
    }
  })

  it('rejects unsupported canvas element types', () => {
    const result = CanvasElementTypeSchema.safeParse('NOT_A_CANVAS_SECTION')

    expect(result.success).toBe(false)
  })
})

describe('CanvasElementInputSchema', () => {
  it('accepts and trims valid input', () => {
    const result = CanvasElementInputSchema.safeParse({
      type: 'KEY_PARTNERS',
      content: '  Strategic suppliers  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('Strategic suppliers')
    }
  })

  it('rejects empty content after trimming', () => {
    const result = CanvasElementInputSchema.safeParse({
      type: 'KEY_PARTNERS',
      content: '   '
    })

    expect(result.success).toBe(false)
  })

  it('rejects content longer than 5000 characters', () => {
    const result = CanvasElementInputSchema.safeParse({
      type: 'KEY_PARTNERS',
      content: 'A'.repeat(5001)
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid types', () => {
    const result = CanvasElementInputSchema.safeParse({
      type: 'INVALID_TYPE',
      content: 'Valid content'
    })

    expect(result.success).toBe(false)
  })
})

describe('ReplaceIdeaVersionCanvasBodySchema', () => {
  it('accepts a valid element list', () => {
    const result = ReplaceIdeaVersionCanvasBodySchema.safeParse({
      elements: [
        {
          type: 'VALUE_PROPOSITIONS',
          content: 'Clear value proposition'
        }
      ]
    })

    expect(result.success).toBe(true)
  })

  it('accepts the 500 element boundary', () => {
    const result = ReplaceIdeaVersionCanvasBodySchema.safeParse({
      elements: Array.from({ length: 500 }, (_, index) => ({
        type: 'CUSTOMER_SEGMENTS',
        content: `Segment ${index + 1}`
      }))
    })

    expect(result.success).toBe(true)
  })

  it('rejects more than 500 elements', () => {
    const result = ReplaceIdeaVersionCanvasBodySchema.safeParse({
      elements: Array.from({ length: 501 }, (_, index) => ({
        type: 'CUSTOMER_SEGMENTS',
        content: `Segment ${index + 1}`
      }))
    })

    expect(result.success).toBe(false)
  })
})

describe('Canvas response schemas', () => {
  const validElement = {
    id: VALID_UUID,
    ideaVersionId: VALID_UUID,
    type: 'CHANNELS' as const,
    content: 'Direct sales',
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid canvas element response', () => {
    const result = CanvasElementResponseSchema.safeParse(validElement)

    expect(result.success).toBe(true)
  })

  it('rejects invalid response timestamps', () => {
    const result = CanvasElementResponseSchema.safeParse({
      ...validElement,
      createdAt: 'not-a-date'
    })

    expect(result.success).toBe(false)
  })

  it('accepts a valid canvas response payload', () => {
    const result = IdeaVersionCanvasResponseSchema.safeParse({
      elements: [validElement]
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid nested canvas elements', () => {
    const result = IdeaVersionCanvasResponseSchema.safeParse({
      elements: [
        {
          ...validElement,
          type: 'NOT_A_SECTION'
        }
      ]
    })

    expect(result.success).toBe(false)
  })
})
