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

describe('POST /api/ideas/:id/versions/:versionId/hypotheses integration', async () => {
  await setup(getE2ESetupOptions())

  const createHypothesisWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for hypothesis creation', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        statement: 'Test hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE',
        canvasSectionTypes: ['CHANNELS']
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates a hypothesis for the authenticated owner and persists trimmed unique canvas links', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-create-owner',
      name: 'Hypotheses Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for hypothesis creation',
      description: 'Fixture idea version'
    })

    const response = await createHypothesisWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, {
      statement: '  Validate our channels  ',
      dimension: 'PROBLEM',
      priority: 'MEDIUM',
      evidenceType: 'QUALITATIVE',
      canvasSectionTypes: ['CHANNELS', 'CHANNELS', 'VALUE_PROPOSITIONS']
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as HypothesisResponseDto

    expect(payload.statement).toBe('Validate our channels')
    expect(payload.canvasSectionLinks).toHaveLength(2)
    expect(new Set(payload.canvasSectionLinks.map(link => link.canvasElementType))).toEqual(
      new Set(['CHANNELS', 'VALUE_PROPOSITIONS'])
    )

    const storedHypothesis = await prisma.hypothesis.findUnique({
      where: { id: payload.id },
      include: {
        canvasSectionLinks: true
      }
    })

    expect(storedHypothesis).not.toBeNull()
    expect(storedHypothesis?.statement).toBe('Validate our channels')
    expect(storedHypothesis?.ideaVersionId).toBe(createdVersion.ideaVersionId)
    expect(storedHypothesis?.canvasSectionLinks).toHaveLength(2)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-create-invalid',
      name: 'Hypotheses Create Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await createHypothesisWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', {
      statement: 'Invalid route test',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      evidenceType: 'QUALITATIVE',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(response.status).toBe(400)
  })

  it('does not allow creating a hypothesis in another users idea version', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-create-owner-b',
      name: 'Hypotheses Create Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-create-attacker',
      name: 'Hypotheses Create Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Protected idea version',
      description: 'Must stay private'
    })

    const response = await createHypothesisWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, {
      statement: 'Attack hypothesis',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      evidenceType: 'QUALITATIVE',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(response.status).toBe(404)

    const storedHypotheses = await prisma.hypothesis.findMany({
      where: { ideaVersionId: createdVersion.ideaVersionId }
    })

    expect(storedHypotheses).toHaveLength(0)
  })
})
