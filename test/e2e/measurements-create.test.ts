import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { MeasurementResponseDto } from '@infrastructure/validation/measurement-schemas'
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

describe('POST /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments/:experimentId/measurements integration', async () => {
  await setup(getE2ESetupOptions())

  const createMeasurementWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    experimentId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments/${experimentId}/measurements`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for measurement creation', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/experiments/${randomUUID()}/measurements`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        metricId: randomUUID(),
        value: 12.5,
        note: 'First cohort'
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates a measurement for the authenticated owner', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-create-owner',
      name: 'Measurements Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement creation',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will convert better with measurements.',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Owner Experiment',
        description: null,
        status: 'RUNNING'
      }
    })

    const metric = await prisma.metric.create({
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

    const response = await createMeasurementWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, {
      metricId: metric.id,
      value: 12.5,
      note: '  First cohort  '
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as MeasurementResponseDto

    expect(payload.experimentId).toBe(experiment.id)
    expect(payload.metricId).toBe(metric.id)
    expect(payload.value).toBe(12.5)
    expect(payload.note).toBe('First cohort')

    const storedMeasurement = await prisma.measurement.findUnique({
      where: { id: payload.id }
    })

    expect(storedMeasurement).not.toBeNull()
    expect(storedMeasurement?.experimentId).toBe(experiment.id)
    expect(storedMeasurement?.metricId).toBe(metric.id)
    expect(Number(storedMeasurement?.value)).toBe(12.5)
    expect(storedMeasurement?.note).toBe('First cohort')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-create-invalid',
      name: 'Measurements Create Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await createMeasurementWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid', {
      metricId: randomUUID(),
      value: 12.5,
      note: null
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user creates a measurement in another users experiment', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-create-owner-b',
      name: 'Measurements Create Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-create-attacker',
      name: 'Measurements Create Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for measurement create',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected measurement hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Protected Experiment',
        description: null,
        status: 'RUNNING'
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

    const response = await createMeasurementWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, {
      metricId: metric.id,
      value: 7,
      note: null
    })

    expect(response.status).toBe(404)
  })

  it('returns 409 when a measurement already exists for the metric in the experiment', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-create-conflict',
      name: 'Measurements Create Conflict'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement conflict',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Measurement conflict hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Conflict Experiment',
        description: null,
        status: 'RUNNING'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Conflict Metric',
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
        value: 10,
        note: null
      }
    })

    const response = await createMeasurementWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, {
      metricId: metric.id,
      value: 11,
      note: 'Duplicate metric measurement'
    })

    expect(response.status).toBe(409)
  })
})
