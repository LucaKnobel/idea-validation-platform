import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { IdeaDetailResponseDto } from '@infrastructure/validation/idea-schemas'
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

describe('GET /api/ideas/:id integration', async () => {
  await setup(getE2ESetupOptions())

  const getIdeaWithCookie = async (cookieHeader: string, ideaId: string): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns idea metadata and version list for owner', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-get-owner',
      name: 'Idea Get Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Owner Idea',
      description: 'Owner Description'
    })

    const baseVersion = await prisma.ideaVersion.findFirstOrThrow({
      where: { ideaId: idea.id },
      orderBy: { versionNumber: 'asc' }
    })

    await prisma.ideaVersion.create({
      data: {
        ideaId: idea.id,
        parentVersionId: baseVersion.id,
        versionNumber: 2,
        type: 'ITERATION',
        title: 'V2',
        description: 'Iteration'
      }
    })

    const response = await getIdeaWithCookie(user.cookieHeader, idea.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaDetailResponseDto

    expect(payload.id).toBe(idea.id)
    expect(payload.latestVersionNumber).toBe(2)
    expect(payload.versions).toHaveLength(2)
    expect(payload.versions[0]?.versionNumber).toBe(2)
    expect(payload.versions[1]?.versionNumber).toBe(1)
  })

  it('returns 404 for foreign idea access', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-get-owner-foreign',
      name: 'Idea Get Owner Foreign'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-get-attacker',
      name: 'Idea Get Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const idea = await createIdeaForUser({
      userId: owner.id,
      title: 'Private Idea'
    })

    const response = await getIdeaWithCookie(attacker.cookieHeader, idea.id)

    expect(response.status).toBe(404)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-get-invalid',
      name: 'Idea Get Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getIdeaWithCookie(user.cookieHeader, 'not-a-uuid')

    expect(response.status).toBe(400)
  })
})
