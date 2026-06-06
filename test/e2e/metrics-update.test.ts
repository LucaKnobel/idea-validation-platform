import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { MetricResponseDto } from '@infrastructure/validation/metric-schemas'
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

describe('PUT /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/metrics/:metricId integration', async () => {
  await setup(getE2ESetupOptions())

  const updateMetricWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    metricId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/metrics/${metricId}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('updates the metric and upserts its threshold in one request', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-update-owner',
      name: 'Metrics Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for metric update',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will pay for concierge onboarding.',
        dimension: 'MONETIZATION',
        priority: 'HIGH'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Willingness To Pay',
        description: 'Initial description',
        dataType: 'NUMBER',
        unit: null
      },
      include: {
        threshold: true
      }
    })

    const response = await updateMetricWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, metric.id, {
      name: '  Willingness To Pay  ',
      description: '  Average amount users are willing to pay.  ',
      unit: ' CHF ',
      threshold: {
        operator: 'GTE',
        referenceValue: 19
      }
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as MetricResponseDto
    expect(payload.name).toBe('Willingness To Pay')
    expect(payload.description).toBe('Average amount users are willing to pay.')
    expect(payload.unit).toBe('CHF')
    expect(payload.dataType).toBe('CURRENCY')
    expect(payload.threshold?.operator).toBe('GTE')
    expect(payload.threshold?.referenceValue).toBe(19)

    const storedMetric = await prisma.metric.findUnique({
      where: { id: metric.id },
      include: { threshold: true }
    })

    expect(storedMetric?.name).toBe('Willingness To Pay')
    expect(storedMetric?.dataType).toBe('CURRENCY')
    expect(storedMetric?.threshold).not.toBeNull()
    expect(storedMetric?.threshold?.operator).toBe('GTE')
    expect(Number(storedMetric?.threshold?.referenceValue)).toBe(19)
  })

  it('returns 404 when trying to update another users metric', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-update-owner-b',
      name: 'Metrics Update Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-update-attacker',
      name: 'Metrics Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Protected idea version for metrics',
      description: 'Must stay private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Protected Metric',
        description: null,
        dataType: 'NUMBER',
        unit: null,
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 1
          }
        }
      }
    })

    const response = await updateMetricWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, metric.id, {
      name: 'Attack Metric',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(response.status).toBe(404)
  })
})
