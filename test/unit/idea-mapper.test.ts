import { describe, expect, it } from 'vitest'
import {
  toIdeaDetailResponseDto,
  toIdeaResponseDto,
  toIdeasListResponseDto,
  toIdeaVersionMetadataResponseDto,
  toIdeaVersionsListResponseDto
} from '@infrastructure/mappers/idea-mapper'
import { makeIdea, makeIdeaVersion, VALID_UUID } from './helpers'

const IDEA_ID = VALID_UUID
const V1_ID = '11111111-1111-4111-8111-111111111111'
const V2_ID = '22222222-2222-4222-8222-222222222222'
const V3_ID = '33333333-3333-4333-8333-333333333333'

describe('idea mapper', () => {
  it('maps idea detail with resolved parent version numbers', () => {
    const v1 = makeIdeaVersion({ id: V1_ID, ideaId: IDEA_ID, versionNumber: 1, type: 'INITIAL', parentVersionId: null, title: 'V1' })
    const v2 = makeIdeaVersion({ id: V2_ID, ideaId: IDEA_ID, versionNumber: 2, type: 'ITERATION', parentVersionId: V1_ID, title: 'V2' })
    const v3 = makeIdeaVersion({ id: V3_ID, ideaId: IDEA_ID, versionNumber: 3, type: 'PIVOT', parentVersionId: V2_ID, title: 'V3' })

    const dto = toIdeaDetailResponseDto(makeIdea({ id: IDEA_ID, versions: [v3, v2, v1] }))

    expect(dto.latestVersionId).toBe(V3_ID)
    expect(dto.latestVersionNumber).toBe(3)
    expect(dto.versions.find(v => v.id === V3_ID)?.parentVersionNumber).toBe(2)
    expect(dto.versions.find(v => v.id === V2_ID)?.parentVersionNumber).toBe(1)
    expect(dto.versions.find(v => v.id === V1_ID)?.parentVersionNumber).toBeNull()
  })

  it('maps versions list with resolved parent version numbers', () => {
    const v1 = makeIdeaVersion({ id: V1_ID, ideaId: IDEA_ID, versionNumber: 1, type: 'INITIAL', parentVersionId: null, title: 'V1' })
    const v2 = makeIdeaVersion({ id: V2_ID, ideaId: IDEA_ID, versionNumber: 2, type: 'ITERATION', parentVersionId: V1_ID, title: 'V2' })

    const dto = toIdeaVersionsListResponseDto([v2, v1])

    expect(dto.items).toHaveLength(2)
    expect(dto.items.find(v => v.id === V2_ID)?.parentVersionNumber).toBe(1)
    expect(dto.items.find(v => v.id === V1_ID)?.parentVersionNumber).toBeNull()
  })

  it('maps created version metadata without parent version number resolution', () => {
    const dto = toIdeaVersionMetadataResponseDto(
      makeIdeaVersion({ id: V2_ID, ideaId: IDEA_ID, versionNumber: 2, parentVersionId: V1_ID, type: 'ITERATION' })
    )

    expect(dto.id).toBe(V2_ID)
    expect(dto.parentVersionId).toBe(V1_ID)
    expect(dto.parentVersionNumber).toBeNull()
  })

  it('maps idea card response from latest version', () => {
    const v1 = makeIdeaVersion({ id: V1_ID, ideaId: IDEA_ID, versionNumber: 1, title: 'V1 title' })
    const v2 = makeIdeaVersion({ id: V2_ID, ideaId: IDEA_ID, versionNumber: 2, title: 'V2 title' })

    const dto = toIdeaResponseDto(makeIdea({ id: IDEA_ID, versions: [v1, v2] }))

    expect(dto.latestVersionId).toBe(V2_ID)
    expect(dto.title).toBe('V2 title')
  })

  it('maps ideas list payload', () => {
    const result = toIdeasListResponseDto({
      ideas: [makeIdea({ id: IDEA_ID, versions: [makeIdeaVersion({ id: V1_ID, ideaId: IDEA_ID })] })],
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
      search: null
    })

    expect(result.items).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.q).toBeNull()
  })
})
