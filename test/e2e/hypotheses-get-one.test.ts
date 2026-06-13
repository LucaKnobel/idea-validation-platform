import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { HypothesisResponseDto } from '@infrastructure/validation/hypothesis-schemas'
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

describe('GET /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId integration', async () => {
  await setup(getE2ESetupOptions())

  const getHypothesisWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for loading one hypothesis', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns one owned hypothesis for the authenticated user', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-get-one-owner',
      name: 'Hypotheses Get One Owner'
    })
    const owner = expectAuthenticatedSessionCreated(ownerResult)

    const version = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Idea for get-one hypothesis',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Owned single hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUALITATIVE',
        canvasSectionLinks: {
          create: [
            { canvasElementType: 'CHANNELS' },
            { canvasElementType: 'VALUE_PROPOSITIONS' }
          ]
        }
      }
    })

    const response = await getHypothesisWithCookie(owner.cookieHeader, version.ideaId, version.ideaVersionId, hypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as HypothesisResponseDto

    expect(payload.id).toBe(hypothesis.id)
    expect(payload.ideaVersionId).toBe(version.ideaVersionId)
    expect(payload.statement).toBe('Owned single hypothesis')
    expect(payload.dimension).toBe('MARKET')
    expect(payload.priority).toBe('MEDIUM')
    expect(payload.canvasSectionLinks).toHaveLength(2)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-get-one-invalid',
      name: 'Hypotheses Get One Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getHypothesisWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user requests a private hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-get-one-owner-b',
      name: 'Hypotheses Get One Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-get-one-attacker',
      name: 'Hypotheses Get One Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const version = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private version for get-one',
      description: 'Private fixture'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Private hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await getHypothesisWithCookie(attacker.cookieHeader, version.ideaId, version.ideaVersionId, hypothesis.id)

    expect(response.status).toBe(404)
  })
})
