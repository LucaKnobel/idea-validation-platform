import { describe, expect, it } from 'vitest'
import {
  CreateIdeaBodySchema,
  GetIdeasQuerySchema,
  IdeaResponseSchema,
  IdeasListResponseSchema,
  UpdateIdeaVersionBodySchema
} from '@infrastructure/validation/idea-schemas'
import { IdeaIdParamsSchema } from '@infrastructure/validation/route-params-schemas'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('CreateIdeaBodySchema', () => {
  it('accepts valid input with title and description', () => {
    expect(CreateIdeaBodySchema.safeParse({
      title: 'My Idea',
      description: 'Some description'
    }).success).toBe(true)
  })

  it('trims whitespace from title and description', () => {
    const result = CreateIdeaBodySchema.safeParse({
      title: '  My Idea  ',
      description: '  Some description  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('My Idea')
      expect(result.data.description).toBe('Some description')
    }
  })

  it('rejects empty title', () => {
    expect(CreateIdeaBodySchema.safeParse({ title: '   ' }).success).toBe(false)
  })

  it('rejects title exceeding 200 characters', () => {
    expect(CreateIdeaBodySchema.safeParse({ title: 'A'.repeat(201) }).success).toBe(false)
  })
})

describe('UpdateIdeaVersionBodySchema', () => {
  it('accepts valid input with title and description', () => {
    expect(UpdateIdeaVersionBodySchema.safeParse({
      title: 'Updated Idea',
      description: 'Updated description'
    }).success).toBe(true)
  })

  it('trims whitespace from title and description', () => {
    const result = UpdateIdeaVersionBodySchema.safeParse({
      title: '  Updated Idea  ',
      description: '  Updated description  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe('Updated Idea')
      expect(result.data.description).toBe('Updated description')
    }
  })

  it('rejects empty title and too long description', () => {
    expect(UpdateIdeaVersionBodySchema.safeParse({ title: '   ' }).success).toBe(false)
    expect(UpdateIdeaVersionBodySchema.safeParse({
      title: 'Valid title',
      description: 'A'.repeat(3001)
    }).success).toBe(false)
  })
})

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
    const result = GetIdeasQuerySchema.safeParse({ page: '3', pageSize: '25' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it('rejects page below 1 and pageSize above 50', () => {
    expect(GetIdeasQuerySchema.safeParse({ page: '0' }).success).toBe(false)
    expect(GetIdeasQuerySchema.safeParse({ pageSize: '51' }).success).toBe(false)
  })
})

describe('IdeaIdParamsSchema', () => {
  it('accepts a valid idea id UUID', () => {
    expect(IdeaIdParamsSchema.safeParse({ id: VALID_UUID }).success).toBe(true)
  })

  it('rejects an invalid idea id UUID', () => {
    expect(IdeaIdParamsSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false)
  })
})

describe('Idea response schemas', () => {
  const validResponse = {
    id: VALID_UUID,
    latestVersionId: VALID_UUID,
    title: 'My Idea',
    description: null,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts a valid idea response', () => {
    expect(IdeaResponseSchema.safeParse(validResponse).success).toBe(true)
  })

  it('accepts a valid paginated list response', () => {
    expect(IdeasListResponseSchema.safeParse({
      items: [validResponse],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
      q: null
    }).success).toBe(true)
  })
})
