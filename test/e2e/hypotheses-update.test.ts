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

describe('PUT /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId integration', async () => {
  await setup(getE2ESetupOptions())

  const updateHypothesisWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for hypothesis updates', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        statement: 'Updated hypothesis',
        dimension: 'SOLUTION',
        priority: 'HIGH',
        canvasSectionTypes: ['CHANNELS']
      })
    })

    expect(response.status).toBe(401)
  })

  it('updates an owned hypothesis and persists the new statement and canvas links', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-update-owner',
      name: 'Hypotheses Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for hypothesis update',
      description: 'Fixture idea version'
    })

    const existingHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Old statement',
        dimension: 'PROBLEM',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE',
        canvasSectionLinks: {
          create: [
            {
              canvasElementType: 'CHANNELS'
            }
          ]
        }
      }
    })

    const response = await updateHypothesisWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, existingHypothesis.id, {
      statement: '  Updated statement  ',
      dimension: 'MARKET',
      priority: 'HIGH',
      canvasSectionTypes: ['VALUE_PROPOSITIONS', 'VALUE_PROPOSITIONS']
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as HypothesisResponseDto

    expect(payload.statement).toBe('Updated statement')
    expect(payload.dimension).toBe('MARKET')
    expect(payload.priority).toBe('HIGH')
    expect(payload.canvasSectionLinks).toHaveLength(1)
    expect(payload.canvasSectionLinks[0]?.canvasElementType).toBe('VALUE_PROPOSITIONS')

    const storedHypothesis = await prisma.hypothesis.findUnique({
      where: { id: existingHypothesis.id },
      include: {
        canvasSectionLinks: true
      }
    })

    expect(storedHypothesis?.statement).toBe('Updated statement')
    expect(storedHypothesis?.dimension).toBe('MARKET')
    expect(storedHypothesis?.priority).toBe('HIGH')
    expect(storedHypothesis?.canvasSectionLinks).toHaveLength(1)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-update-invalid',
      name: 'Hypotheses Update Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await updateHypothesisWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', {
      statement: 'Updated statement',
      dimension: 'MARKET',
      priority: 'HIGH',
      canvasSectionTypes: ['VALUE_PROPOSITIONS']
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to update the hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-update-owner-b',
      name: 'Hypotheses Update Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-update-attacker',
      name: 'Hypotheses Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for update',
      description: 'Private'
    })

    const existingHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected statement',
        dimension: 'EXECUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await updateHypothesisWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, existingHypothesis.id, {
      statement: 'Attack update',
      dimension: 'MARKET',
      priority: 'HIGH',
      canvasSectionTypes: ['VALUE_PROPOSITIONS']
    })

    expect(response.status).toBe(404)
  })
})
