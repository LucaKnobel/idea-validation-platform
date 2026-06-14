import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
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

describe('DELETE /api/hypotheses/:hypothesisId integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteHypothesisWithCookie = async (
    cookieHeader: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}`), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for hypothesis deletion', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}`), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes an owned hypothesis and removes it from the database', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-delete-owner',
      name: 'Hypotheses Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for hypothesis deletion',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Delete me',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await deleteHypothesisWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(204)

    const deletedHypothesis = await prisma.hypothesis.findUnique({
      where: { id: hypothesis.id }
    })

    expect(deletedHypothesis).toBeNull()
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-delete-invalid',
      name: 'Hypotheses Delete Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteHypothesisWithCookie(user.cookieHeader, 'still-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to delete the hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-delete-owner-b',
      name: 'Hypotheses Delete Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'hypotheses-delete-attacker',
      name: 'Hypotheses Delete Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for delete',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected hypothesis',
        dimension: 'MONETIZATION',
        priority: 'MEDIUM',
        evidenceType: 'QUALITATIVE'
      }
    })

    const response = await deleteHypothesisWithCookie(attacker.cookieHeader, hypothesis.id)

    expect(response.status).toBe(404)

    const stillExisting = await prisma.hypothesis.findUnique({
      where: { id: hypothesis.id }
    })

    expect(stillExisting).not.toBeNull()
  })
})
