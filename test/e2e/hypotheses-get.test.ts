import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { HypothesesListResponseDto } from '@infrastructure/validation/hypothesis-schemas'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createIdeaVersionForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('GET /api/ideas/:id/versions/:versionId/hypotheses integration', async () => {
  await setup(getE2ESetupOptions())

  const getHypothesesWithCookie = async (cookieHeader: string, ideaId: string, versionId: string): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for hypothesis listing', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns only hypotheses owned by the authenticated user', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-list-owner',
      name: 'Hypotheses List Owner'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-list-attacker',
      name: 'Hypotheses List Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Owner visible version',
      description: 'Owner fixture'
    })

    const attackerVersion = await createIdeaVersionForUser({
      userId: attacker.id,
      title: 'Attacker version',
      description: 'Attacker fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Owner hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE'
      }
    })

    await prisma.hypothesis.create({
      data: {
        ideaVersionId: attackerVersion.ideaVersionId,
        statement: 'Attacker hypothesis',
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await getHypothesesWithCookie(owner.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId)

    expect(response.status).toBe(200)

    const payload = await response.json() as HypothesesListResponseDto

    expect(payload.items).toHaveLength(1)
    expect(payload.items[0]?.id).toBe(ownerHypothesis.id)
    expect(payload.items[0]?.statement).toBe('Owner hypothesis')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-list-invalid',
      name: 'Hypotheses List Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getHypothesesWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user requests another users idea version', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-list-owner-b',
      name: 'Hypotheses List Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-list-attacker-b',
      name: 'Hypotheses List Attacker B'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private owner version',
      description: 'Private'
    })

    await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Private owner hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await getHypothesesWithCookie(attacker.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId)

    expect(response.status).toBe(404)
  })
})
