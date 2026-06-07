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

describe('POST /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/metrics integration', async () => {
  await setup(getE2ESetupOptions())

  const createMetricWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/metrics`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for metric creation', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/metrics`), {
      method: 'POST',
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

  it('creates a metric with its threshold', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-create-owner',
      name: 'Metrics Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for metric creation',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will convert better with a shorter form.',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const response = await createMetricWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, {
      name: 'Conversion Rate',
      description: 'Measures sign-up conversion.',
      unit: '%',
      threshold: {
        operator: 'GTE',
        referenceValue: 10
      }
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as MetricResponseDto
    expect(payload.name).toBe('Conversion Rate')
    expect(payload.description).toBe('Measures sign-up conversion.')
    expect(payload.unit).toBe('%')
    expect(payload.threshold).not.toBeNull()
    expect(payload.threshold?.operator).toBe('GTE')
    expect(payload.threshold?.referenceValue).toBe(10)

    const storedMetric = await prisma.metric.findUnique({
      where: { id: payload.id },
      include: { threshold: true }
    })

    expect(storedMetric).not.toBeNull()
    expect(storedMetric?.threshold?.operator).toBe('GTE')
    expect(Number(storedMetric?.threshold?.referenceValue)).toBe(10)
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-create-invalid',
      name: 'Metrics Create Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await createMetricWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', {
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
})
