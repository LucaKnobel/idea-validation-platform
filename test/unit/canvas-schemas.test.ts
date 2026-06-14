import { describe, expect, it } from 'vitest'
import {
  CanvasElementInputSchema,
  CanvasElementResponseSchema,
  CanvasElementTypeSchema,
  IdeaVersionCanvasResponseSchema,
  ReplaceIdeaVersionCanvasBodySchema
} from '@infrastructure/validation/canvas-schemas'
import { IdeaVersionIdRouteParamsSchema } from '@infrastructure/validation/route-params-schemas'
import { canvasElementTypes } from '@application/models/canvas-element'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('Canvas route schemas', () => {
  it('accepts canonical idea-version canvas params', () => {
    expect(IdeaVersionIdRouteParamsSchema.safeParse({
      versionId: VALID_UUID
    }).success).toBe(true)
  })

  it('rejects invalid version ids', () => {
    expect(IdeaVersionIdRouteParamsSchema.safeParse({
      versionId: 'not-a-uuid'
    }).success).toBe(false)
  })
})

describe('CanvasElementTypeSchema', () => {
  it('accepts every supported canvas element type', () => {
    for (const type of canvasElementTypes) {
      expect(CanvasElementTypeSchema.safeParse(type).success).toBe(true)
    }
  })

  it('rejects unsupported canvas element types', () => {
    expect(CanvasElementTypeSchema.safeParse('NOT_A_CANVAS_SECTION').success).toBe(false)
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
    expect(CanvasElementInputSchema.safeParse({
      type: 'KEY_PARTNERS',
      content: '   '
    }).success).toBe(false)
  })
})

describe('ReplaceIdeaVersionCanvasBodySchema', () => {
  it('accepts a valid element list', () => {
    expect(ReplaceIdeaVersionCanvasBodySchema.safeParse({
      elements: [
        {
          type: 'VALUE_PROPOSITIONS',
          content: 'Clear value proposition'
        }
      ]
    }).success).toBe(true)
  })

  it('rejects more than 500 elements', () => {
    expect(ReplaceIdeaVersionCanvasBodySchema.safeParse({
      elements: Array.from({ length: 501 }, (_, index) => ({
        type: 'CUSTOMER_SEGMENTS',
        content: `Segment ${index + 1}`
      }))
    }).success).toBe(false)
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
    expect(CanvasElementResponseSchema.safeParse(validElement).success).toBe(true)
  })

  it('accepts a valid canvas response payload', () => {
    expect(IdeaVersionCanvasResponseSchema.safeParse({
      elements: [validElement]
    }).success).toBe(true)
  })
})
