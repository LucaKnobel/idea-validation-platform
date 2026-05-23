import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { IdeasListResponseDto } from '@shared/types/idea'

import {
  clearAuthTables,
  createAuthenticatedSession,
  expectAuthenticatedSessionCreated,
  getApiWithCookie,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createIdeaForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('GET /api/ideas integration', async () => {
  await setup(getE2ESetupOptions())

  const getIdeasWithCookie = async (
    cookieHeader: string,
    query?: { page?: number, pageSize?: number, q?: string }
  ): Promise<Response> => {
    const params = new URLSearchParams()

    if (typeof query?.page !== 'undefined') {
      params.set('page', String(query.page))
    }

    if (typeof query?.pageSize !== 'undefined') {
      params.set('pageSize', String(query.pageSize))
    }

    if (typeof query?.q !== 'undefined') {
      params.set('q', query.q)
    }

    const path = params.size > 0
      ? `/api/ideas?${params.toString()}`
      : '/api/ideas'

    return getApiWithCookie(path, cookieHeader)
  }

  it('requires authentication for ideas listing', async () => {
    const response = await fetch(url('/api/ideas'), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('does not expose ideas from another user', async () => {
    const userAResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-isolation-a',
      name: 'Ideas Isolation A'
    })
    const userBResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-isolation-b',
      name: 'Ideas Isolation B'
    })

    const userA = expectAuthenticatedSessionCreated(userAResult)
    const userB = expectAuthenticatedSessionCreated(userBResult)

    const userBIdea = await createIdeaForUser({
      userId: userB.id,
      title: 'Private idea from user B',
      description: 'Must not be visible to user A'
    })

    const response = await getIdeasWithCookie(userA.cookieHeader, {
      page: 1,
      pageSize: 10
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeasListResponseDto

    expect(payload.total).toBe(0)
    expect(payload.items).toHaveLength(0)
    expect(payload.items.some(item => item.id === userBIdea.id)).toBe(false)
  })

  it('returns only the authenticated user ideas with correct pagination metadata', async () => {
    const userAResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-owner-a',
      name: 'Ideas Owner A'
    })
    const userBResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-owner-b',
      name: 'Ideas Owner B'
    })

    const userA = expectAuthenticatedSessionCreated(userAResult)
    const userB = expectAuthenticatedSessionCreated(userBResult)

    const ideaA1 = await createIdeaForUser({
      userId: userA.id,
      title: 'Owner A - Idea 1',
      description: 'A1'
    })

    const ideaA2 = await createIdeaForUser({
      userId: userA.id,
      title: 'Owner A - Idea 2',
      description: 'A2'
    })

    const ideaA3 = await createIdeaForUser({
      userId: userA.id,
      title: 'Owner A - Idea 3',
      description: 'A3'
    })

    await createIdeaForUser({
      userId: userB.id,
      title: 'Owner B - Idea 1',
      description: 'B1'
    })

    await createIdeaForUser({
      userId: userB.id,
      title: 'Owner B - Idea 2',
      description: 'B2'
    })

    const response = await getIdeasWithCookie(userA.cookieHeader, {
      page: 1,
      pageSize: 2
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeasListResponseDto

    expect(payload.page).toBe(1)
    expect(payload.pageSize).toBe(2)
    expect(payload.total).toBe(3)
    expect(payload.totalPages).toBe(2)
    expect(payload.q).toBeNull()
    expect(payload.items.length).toBe(2)

    const userAIdeaIds = new Set([ideaA1.id, ideaA2.id, ideaA3.id])
    expect(payload.items.every(item => userAIdeaIds.has(item.id))).toBe(true)
  })

  it('applies trimmed case-insensitive search for title and description', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-search-owner',
      name: 'Ideas Search Owner'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)

    await createIdeaForUser({
      userId: owner.id,
      title: 'Alpha Launch',
      description: null
    })

    await createIdeaForUser({
      userId: owner.id,
      title: 'Beta Idea',
      description: 'Customer ALPHA interviews'
    })

    await createIdeaForUser({
      userId: owner.id,
      title: 'Gamma',
      description: 'Unrelated text'
    })

    const response = await getIdeasWithCookie(owner.cookieHeader, {
      page: 1,
      pageSize: 10,
      q: '  alpha  '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeasListResponseDto

    expect(payload.q).toBe('alpha')
    expect(payload.total).toBe(2)
    expect(payload.totalPages).toBe(1)
    expect(payload.items.length).toBe(2)

    const matchedTitles = payload.items.map(item => item.title)
    expect(matchedTitles).toContain('Alpha Launch')
    expect(matchedTitles).toContain('Beta Idea')
  })

  it('rejects invalid query values with 400', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-list-invalid-query-owner',
      name: 'Ideas Invalid Query Owner'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)

    const response = await getIdeasWithCookie(owner.cookieHeader, {
      page: 1,
      pageSize: 0
    })

    expect(response.status).toBe(400)
  })
})
