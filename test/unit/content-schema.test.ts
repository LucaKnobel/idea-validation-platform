import { describe, it, expect } from 'vitest'
import { GetContentParamsSchema, GetContentQuerySchema } from '../../server/api/schemas/content-schemas'

describe('GetContentParamsSchema', () => {
  it('accepts a valid slug', () => {
    const validInput = { slug: 'legal/privacy' }

    const result = GetContentParamsSchema.safeParse(validInput)

    expect(result.success).toBe(true)
  })

  it('rejects empty slug', () => {
    const invalidInput = { slug: '' }

    const result = GetContentParamsSchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })
})

describe('GetContentQuerySchema', () => {
  it('defaults locale to en', () => {
    const result = GetContentQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.locale).toBe('en')
    }
  })

  it('rejects unsupported locale', () => {
    const invalidInput = { locale: 'fr' }

    const result = GetContentQuerySchema.safeParse(invalidInput)

    expect(result.success).toBe(false)
  })
})
