import { randomUUID } from 'node:crypto'
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

describe('PUT /api/hypotheses/:hypothesisId/metric integration', async () => {
  await setup(getE2ESetupOptions())

  const putMetricWithCookie = async (
    cookieHeader: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/metric`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/metric`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Conversion Rate',
        description: 'Measures sign-up conversion.',
        unit: '%',
        threshold: {
          operator: 'GTE',
          referenceValue: 10
        }
      })
    })

    expect(response.status).toBe(401)
  })

  it('updates an existing metric and upserts threshold', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-put-owner',
      name: 'Metrics Put Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for metric put',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will pay for concierge onboarding.',
        dimension: 'MONETIZATION',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Willingness To Pay',
        description: 'Initial description',
        unit: null
      }
    })

    const response = await putMetricWithCookie(user.cookieHeader, hypothesis.id, {
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
    expect(payload.id).toBe(metric.id)
    expect(payload.name).toBe('Willingness To Pay')
    expect(payload.description).toBe('Average amount users are willing to pay.')
    expect(payload.unit).toBe('CHF')
    expect(payload.threshold?.operator).toBe('GTE')
    expect(payload.threshold?.referenceValue).toBe(19)

    const storedMetric = await prisma.metric.findUnique({
      where: { id: metric.id },
      include: { threshold: true }
    })

    expect(storedMetric?.name).toBe('Willingness To Pay')
    expect(storedMetric?.threshold).not.toBeNull()
    expect(storedMetric?.threshold?.operator).toBe('GTE')
    expect(Number(storedMetric?.threshold?.referenceValue)).toBe(19)
  })

  it('creates metric when missing for an owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-put-create',
      name: 'Metrics Put Create'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for metric put create',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Create metric by put',
        dimension: 'PROBLEM',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await putMetricWithCookie(user.cookieHeader, hypothesis.id, {
      name: 'Signup Rate',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as MetricResponseDto
    expect(payload.name).toBe('Signup Rate')
    expect(payload.unit).toBe('%')
    expect(payload.threshold?.operator).toBe('GTE')
    expect(payload.threshold?.referenceValue).toBe(10)
  })

  it('returns 400 for invalid hypothesisId route param', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-put-invalid',
      name: 'Metrics Put Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await putMetricWithCookie(user.cookieHeader, 'not-a-uuid', {
      name: 'Conversion Rate',
      description: null,
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when updating another users hypothesis metric', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-put-owner-b',
      name: 'Metrics Put Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-put-attacker',
      name: 'Metrics Put Attacker'
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
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
      }
    })

    await prisma.metric.create({
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

    const response = await putMetricWithCookie(attacker.cookieHeader, hypothesis.id, {
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
