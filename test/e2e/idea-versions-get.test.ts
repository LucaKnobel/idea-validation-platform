import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { IdeaVersionsListResponseDto } from '@infrastructure/validation/idea-schemas'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createIdeaForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('GET /api/ideas/:id/versions integration', async () => {
  await setup(getE2ESetupOptions())

  const getIdeaVersionsWithCookie = async (cookieHeader: string, ideaId: string): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns versions sorted desc with parentVersionNumber resolved', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-get-owner',
      name: 'Idea Versions Get Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Versioned Idea',
      description: 'Version fixture'
    })

    const v1 = await prisma.ideaVersion.findFirstOrThrow({
      where: { ideaId: idea.id },
      orderBy: { versionNumber: 'asc' }
    })

    const v2 = await prisma.ideaVersion.create({
      data: {
        ideaId: idea.id,
        parentVersionId: v1.id,
        versionNumber: 2,
        type: 'ITERATION',
        title: 'V2',
        description: null
      }
    })

    await prisma.ideaVersion.create({
      data: {
        ideaId: idea.id,
        parentVersionId: v2.id,
        versionNumber: 3,
        type: 'PIVOT',
        title: 'V3',
        description: null
      }
    })

    const response = await getIdeaVersionsWithCookie(user.cookieHeader, idea.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionsListResponseDto

    expect(payload.items).toHaveLength(3)
    expect(payload.items.map(v => v.versionNumber)).toEqual([3, 2, 1])
    expect(payload.items.find(v => v.versionNumber === 3)?.parentVersionNumber).toBe(2)
    expect(payload.items.find(v => v.versionNumber === 2)?.parentVersionNumber).toBe(1)
    expect(payload.items.find(v => v.versionNumber === 1)?.parentVersionNumber).toBeNull()
  })

  it('returns 404 for foreign idea access', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-get-owner-foreign',
      name: 'Idea Versions Get Owner Foreign'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-get-attacker',
      name: 'Idea Versions Get Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const idea = await createIdeaForUser({
      userId: owner.id,
      title: 'Private version list'
    })

    const response = await getIdeaVersionsWithCookie(attacker.cookieHeader, idea.id)

    expect(response.status).toBe(404)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-get-invalid',
      name: 'Idea Versions Get Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getIdeaVersionsWithCookie(user.cookieHeader, 'not-a-uuid')

    expect(response.status).toBe(400)
  })
})
