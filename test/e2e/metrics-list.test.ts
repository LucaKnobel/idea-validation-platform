import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { MetricsListResponseDto } from '@infrastructure/validation/metric-schemas'
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

describe('GET /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/metrics integration', async () => {
  await setup(getE2ESetupOptions())

  const getMetricsWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/metrics`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for metric listing', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/metrics`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns only metrics owned by the authenticated user', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-list-owner',
      name: 'Metrics List Owner'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-list-attacker',
      name: 'Metrics List Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Owner metrics version',
      description: 'Owner fixture'
    })

    const attackerVersion = await createIdeaVersionForUser({
      userId: attacker.id,
      title: 'Attacker metrics version',
      description: 'Attacker fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Owner hypothesis for metrics',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const attackerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: attackerVersion.ideaVersionId,
        statement: 'Attacker hypothesis for metrics',
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const ownerMetric = await prisma.metric.create({
      data: {
        hypothesisId: ownerHypothesis.id,
        name: 'Conversion Rate',
        description: 'Measures sign-up conversion.',
        unit: '%',
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 10
          }
        }
      },
      include: {
        threshold: true
      }
    })

    await prisma.metric.create({
      data: {
        hypothesisId: attackerHypothesis.id,
        name: 'Attacker Metric',
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

    const response = await getMetricsWithCookie(owner.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId, ownerHypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as MetricsListResponseDto

    expect(payload.items).toHaveLength(1)
    expect(payload.items[0]?.id).toBe(ownerMetric.id)
    expect(payload.items[0]?.name).toBe('Conversion Rate')
    expect(payload.items[0]?.unit).toBe('%')
    expect(payload.items[0]?.threshold?.operator).toBe('GTE')
    expect(payload.items[0]?.threshold?.referenceValue).toBe(10)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-list-invalid',
      name: 'Metrics List Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getMetricsWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user requests another users hypothesis metrics', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-list-owner-b',
      name: 'Metrics List Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-list-attacker-b',
      name: 'Metrics List Attacker B'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private metrics version',
      description: 'Private fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Private metrics hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    await prisma.metric.create({
      data: {
        hypothesisId: ownerHypothesis.id,
        name: 'Private Metric',
        description: null,
        unit: null,
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 5
          }
        }
      }
    })

    const response = await getMetricsWithCookie(attacker.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId, ownerHypothesis.id)

    expect(response.status).toBe(404)
  })
})
