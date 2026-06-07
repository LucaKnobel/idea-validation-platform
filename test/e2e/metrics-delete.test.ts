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

describe('DELETE /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/metrics/:metricId integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteMetricWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    metricId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/metrics/${metricId}`), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for metric deletion', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/metrics/${randomUUID()}`), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes an owned metric and removes it from the database', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-delete-owner',
      name: 'Metrics Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for metric deletion',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Delete metric hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Delete Me',
        description: 'Metric scheduled for deletion',
        unit: '%',
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 10
          }
        }
      }
    })

    const response = await deleteMetricWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, metric.id)

    expect(response.status).toBe(204)

    const deletedMetric = await prisma.metric.findUnique({
      where: { id: metric.id }
    })

    expect(deletedMetric).toBeNull()
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-delete-invalid',
      name: 'Metrics Delete Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteMetricWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to delete the metric', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-delete-owner-b',
      name: 'Metrics Delete Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-delete-attacker',
      name: 'Metrics Delete Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for metric delete',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected metric hypothesis',
        dimension: 'MONETIZATION',
        priority: 'MEDIUM'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Protected Metric',
        description: null,
        unit: null,
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 1
          }
        }
      }
    })

    const response = await deleteMetricWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, metric.id)

    expect(response.status).toBe(404)

    const stillExisting = await prisma.metric.findUnique({
      where: { id: metric.id }
    })

    expect(stillExisting).not.toBeNull()
  })
})
