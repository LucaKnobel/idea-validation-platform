import { describe, expect, it } from 'vitest'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

describe('createNullableTrimmedStringSchema', () => {
  const schema = createNullableTrimmedStringSchema(10, 'Too long')

  it('accepts null values', () => {
    const result = schema.safeParse(null)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it('trims non-empty strings', () => {
    const result = schema.safeParse('  hello  ')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('hello')
    }
  })

  it('normalizes empty strings to null after trimming', () => {
    const result = schema.safeParse('   ')

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBeNull()
    }
  })

  it('rejects strings above configured max length after trimming', () => {
    expect(schema.safeParse('  this-value-is-too-long  ').success).toBe(false)
  })

  it('accepts strings exactly at the configured max length', () => {
    expect(schema.safeParse('0123456789').success).toBe(true)
  })

  it('rejects non-string and non-null values', () => {
    expect(schema.safeParse(123).success).toBe(false)
  })
})
