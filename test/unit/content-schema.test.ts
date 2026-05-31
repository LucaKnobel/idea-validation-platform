import { describe, it, expect } from 'vitest'
import { GetContentParamsSchema } from '@infrastructure/validation/content-schemas'

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

  it('rejects missing slug field', () => {
    const result = GetContentParamsSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects null slug', () => {
    const result = GetContentParamsSchema.safeParse({ slug: null })

    expect(result.success).toBe(false)
  })

  it('accepts slug with nested path', () => {
    const result = GetContentParamsSchema.safeParse({ slug: 'legal/privacy' })

    expect(result.success).toBe(true)
  })
})
