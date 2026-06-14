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

describe('GET /api/hypotheses/:hypothesisId/metric integration', async () => {
  await setup(getE2ESetupOptions())

  const getMetricWithCookie = async (
    cookieHeader: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/metric`), {
      method: 'GET',
      headers: {
        cookie: cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/metric`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns the metric singleton for an owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-get-owner',
      name: 'Metrics Get Owner'
    })

    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Metric get version',
      description: 'Owned fixture'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Owned hypothesis for metric get',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const createdMetric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Conversion Rate',
        description: 'Measures sign-up conversion.',
        unit: '%',
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 10
          }
        }
      }
    })

    const response = await getMetricWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as MetricResponseDto
    expect(payload.id).toBe(createdMetric.id)
    expect(payload.name).toBe('Conversion Rate')
    expect(payload.description).toBe('Measures sign-up conversion.')
    expect(payload.unit).toBe('%')
    expect(payload.threshold?.operator).toBe('GTE')
    expect(payload.threshold?.referenceValue).toBe(10)
  })

  it('returns 400 for invalid hypothesisId route param', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-get-invalid',
      name: 'Metrics Get Invalid'
    })

    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getMetricWithCookie(user.cookieHeader, 'not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when metric does not exist for owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-get-missing',
      name: 'Metrics Get Missing'
    })

    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Metric missing version',
      description: 'No metric fixture'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Owned hypothesis without metric',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await getMetricWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(404)
  })

  it('returns 404 for another users hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-get-owner-b',
      name: 'Metrics Get Owner B'
    })

    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'metrics-get-attacker-b',
      name: 'Metrics Get Attacker B'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private metric version',
      description: 'Private fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Private hypothesis',
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
      }
    })

    await prisma.metric.create({
      data: {
        hypothesisId: ownerHypothesis.id,
        name: 'Private metric',
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

    const response = await getMetricWithCookie(attacker.cookieHeader, ownerHypothesis.id)

    expect(response.status).toBe(404)
  })
})
