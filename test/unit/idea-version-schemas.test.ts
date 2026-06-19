import { describe, expect, it } from 'vitest'
import {
  CreateIdeaVersionBodySchema,
  IdeaDetailResponseSchema,
  IdeaVersionMetadataSchema,
  IdeaVersionsListResponseSchema
} from '@infrastructure/validation/idea-schemas'
import { VALID_ISO_DATETIME, VALID_UUID } from './helpers'

describe('CreateIdeaVersionBodySchema', () => {
  it('accepts valid create-version payloads', () => {
    expect(CreateIdeaVersionBodySchema.safeParse({
      baseVersionId: VALID_UUID,
      type: 'ITERATION'
    }).success).toBe(true)

    expect(CreateIdeaVersionBodySchema.safeParse({
      baseVersionId: VALID_UUID,
      type: 'PIVOT'
    }).success).toBe(true)
  })

  it('rejects invalid uuid and unsupported type', () => {
    expect(CreateIdeaVersionBodySchema.safeParse({
      baseVersionId: 'not-a-uuid',
      type: 'ITERATION'
    }).success).toBe(false)

    expect(CreateIdeaVersionBodySchema.safeParse({
      baseVersionId: VALID_UUID,
      type: 'INITIAL'
    }).success).toBe(false)
  })
})

describe('IdeaVersionMetadataSchema', () => {
  const validMetadata = {
    id: VALID_UUID,
    versionNumber: 3,
    type: 'ITERATION' as const,
    parentVersionId: VALID_UUID,
    parentVersionNumber: 2,
    title: 'Version title',
    description: 'Version description',
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts valid version metadata', () => {
    expect(IdeaVersionMetadataSchema.safeParse(validMetadata).success).toBe(true)
  })

  it('accepts null parent fields for initial versions', () => {
    expect(IdeaVersionMetadataSchema.safeParse({
      ...validMetadata,
      type: 'INITIAL',
      parentVersionId: null,
      parentVersionNumber: null
    }).success).toBe(true)
  })

  it('rejects invalid numeric and datetime fields', () => {
    expect(IdeaVersionMetadataSchema.safeParse({
      ...validMetadata,
      versionNumber: 0
    }).success).toBe(false)

    expect(IdeaVersionMetadataSchema.safeParse({
      ...validMetadata,
      parentVersionNumber: 0
    }).success).toBe(false)

    expect(IdeaVersionMetadataSchema.safeParse({
      ...validMetadata,
      createdAt: 'not-a-date'
    }).success).toBe(false)
  })
})

describe('IdeaDetailResponseSchema', () => {
  const validItem = {
    id: VALID_UUID,
    versionNumber: 1,
    type: 'INITIAL' as const,
    parentVersionId: null,
    parentVersionNumber: null,
    title: 'V1',
    description: null,
    createdAt: VALID_ISO_DATETIME,
    updatedAt: VALID_ISO_DATETIME
  }

  it('accepts valid detail response', () => {
    expect(IdeaDetailResponseSchema.safeParse({
      id: VALID_UUID,
      latestVersionId: VALID_UUID,
      latestVersionNumber: 1,
      versions: [validItem],
      createdAt: VALID_ISO_DATETIME,
      updatedAt: VALID_ISO_DATETIME
    }).success).toBe(true)
  })

  it('rejects invalid latest version number', () => {
    expect(IdeaDetailResponseSchema.safeParse({
      id: VALID_UUID,
      latestVersionId: VALID_UUID,
      latestVersionNumber: 0,
      versions: [validItem],
      createdAt: VALID_ISO_DATETIME,
      updatedAt: VALID_ISO_DATETIME
    }).success).toBe(false)
  })
})

describe('IdeaVersionsListResponseSchema', () => {
  it('accepts valid versions list', () => {
    expect(IdeaVersionsListResponseSchema.safeParse({
      items: [{
        id: VALID_UUID,
        versionNumber: 1,
        type: 'INITIAL',
        parentVersionId: null,
        parentVersionNumber: null,
        title: 'V1',
        description: null,
        createdAt: VALID_ISO_DATETIME,
        updatedAt: VALID_ISO_DATETIME
      }]
    }).success).toBe(true)
  })
})
