import { describe, expect, it } from 'vitest'
import {
  CreateIdeaBodySchema,
  GetIdeasQuerySchema,
  IdeaRouteParamsSchema
} from '@infrastructure/validation/idea-schemas'

const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'

// CreateIdeaBodySchema

describe('CreateIdeaBodySchema', () => {
  it('accepts valid input with title and description', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'My Idea',
      description: 'Some description'
    })

    expect(result.success).toBe(true)
  })

  it('accepts valid input without description', () => {
    const result = CreateIdeaBodySchema.safeParse({ title: 'My Idea' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBeUndefined()
    }
  })

  it('trims whitespace from title', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: '  My Idea  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('My Idea')
    }
  })

  it('trims whitespace from description', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'My Idea',
      description: '  Some description  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Some description')
    }
  })

  it('rejects empty title', () => {
    const result = CreateIdeaBodySchema.safeParse({ title: '' })

    expect(result.success).toBe(false)
  })

  it('rejects title that is only whitespace', () => {
    const result = CreateIdeaBodySchema.safeParse({ title: '   ' })

    expect(result.success).toBe(false)
  })

  it('rejects missing title', () => {
    const result = CreateIdeaBodySchema.safeParse({
      description: 'Some description'
    })

    expect(result.success).toBe(false)
  })

  it('rejects title exceeding 200 characters', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'A'.repeat(201)
    })

    expect(result.success).toBe(false)
  })

  it('accepts title at the 200-character boundary', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'A'.repeat(200)
    })

    expect(result.success).toBe(true)
  })

  it('rejects description exceeding 3000 characters', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'My Idea',
      description: 'A'.repeat(3001)
    })

    expect(result.success).toBe(false)
  })

  it('accepts description at the 3000-character boundary', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: 'My Idea',
      description: 'A'.repeat(3000)
    })

    expect(result.success).toBe(true)
  })
})

// GetIdeasQuerySchema

describe('GetIdeasQuerySchema', () => {
  it('applies defaults when no query params are provided', () => {
    const result = GetIdeasQuerySchema.safeParse({})

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(10)
      expect(result.data.q).toBeUndefined()
    }
  })

  it('coerces string page and pageSize to numbers', () => {
    const result = GetIdeasQuerySchema.safeParse({
      page: '3',
      pageSize: '25'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('accepts a search query', () => {
    const result = GetIdeasQuerySchema.safeParse({ q: 'saas' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe('saas')
    }
  })

  it('trims whitespace from search query', () => {
    const result = GetIdeasQuerySchema.safeParse({ q: '  saas  ' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.q).toBe('saas')
    }
  })

  it('rejects page below 1', () => {
    const result = GetIdeasQuerySchema.safeParse({ page: '0' })

    expect(result.success).toBe(false)
  })

  it('rejects pageSize below 1', () => {
    const result = GetIdeasQuerySchema.safeParse({ pageSize: '0' })

    expect(result.success).toBe(false)
  })

  it('rejects pageSize above 50', () => {
    const result = GetIdeasQuerySchema.safeParse({ pageSize: '51' })

    expect(result.success).toBe(false)
  })

  it('accepts pageSize at the 50-item boundary', () => {
    const result = GetIdeasQuerySchema.safeParse({ pageSize: '50' })

    expect(result.success).toBe(true)
  })

  it('rejects search query exceeding 200 characters', () => {
    const result = GetIdeasQuerySchema.safeParse({ q: 'a'.repeat(201) })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer page', () => {
    const result = GetIdeasQuerySchema.safeParse({ page: '1.5' })

    expect(result.success).toBe(false)
  })
})

// IdeaRouteParamsSchema

describe('IdeaRouteParamsSchema', () => {
  it('accepts a valid UUID', () => {
    const result = IdeaRouteParamsSchema.safeParse({ id: VALID_UUID })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid UUID', () => {
    const result = IdeaRouteParamsSchema.safeParse({ id: 'not-a-uuid' })

    expect(result.success).toBe(false)
  })

  it('rejects missing id', () => {
    const result = IdeaRouteParamsSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects empty string as id', () => {
    const result = IdeaRouteParamsSchema.safeParse({ id: '' })

    expect(result.success).toBe(false)
  })
})
