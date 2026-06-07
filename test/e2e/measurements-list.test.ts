import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { MeasurementsListResponseDto } from '@infrastructure/validation/measurement-schemas'
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

describe('GET /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments/:experimentId/measurements integration', async () => {
  await setup(getE2ESetupOptions())

  const getMeasurementsWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    experimentId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments/${experimentId}/measurements`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for measurement listing', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/experiments/${randomUUID()}/measurements`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns measurements for an owned experiment', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-list-owner',
      name: 'Measurements List Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement listing',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Owner hypothesis for measurements',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Owner Experiment',
        description: 'Measurement experiment',
        status: 'RUNNING'
      }
    })

    const metricA = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Conversion Rate',
        description: null,
        unit: '%',
        threshold: {
          create: {
            operator: 'GTE',
            referenceValue: 10
          }
        }
      }
    })

    const metricB = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Interview Count',
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

    const measurementA = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metricA.id,
        value: 12.5,
        note: 'First cohort'
      }
    })

    await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metricB.id,
        value: 27,
        note: null
      }
    })

    const response = await getMeasurementsWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementsListResponseDto

    expect(payload.items).toHaveLength(2)
    const listedMeasurementA = payload.items.find(item => item.id === measurementA.id)
    expect(listedMeasurementA?.experimentId).toBe(experiment.id)
    expect(listedMeasurementA?.metricId).toBe(metricA.id)
    expect(listedMeasurementA?.value).toBe(12.5)
    expect(listedMeasurementA?.note).toBe('First cohort')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-list-invalid',
      name: 'Measurements List Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getMeasurementsWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user requests another users experiment measurements', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-list-owner-b',
      name: 'Measurements List Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-list-attacker',
      name: 'Measurements List Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for measurements',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected measurements hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Private Experiment',
        description: null,
        status: 'RUNNING'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Private Metric',
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

    await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metric.id,
        value: 3,
        note: null
      }
    })

    const response = await getMeasurementsWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id)

    expect(response.status).toBe(404)
  })
})
