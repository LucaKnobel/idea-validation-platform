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

describe('PUT /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments/:experimentId/measurements/:measurementId integration', async () => {
  await setup(getE2ESetupOptions())

  const updateMeasurementWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    experimentId: string,
    measurementId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments/${experimentId}/measurements/${measurementId}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('updates an owned measurement', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-update-owner',
      name: 'Measurements Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement update',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will convert better with updated measurements.',
        dimension: 'MONETIZATION',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
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
        name: 'Metric',
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

    const measurement = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metric.id,
        value: 6,
        note: 'Before update'
      }
    })

    const response = await updateMeasurementWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, measurement.id, {
      metricId: metric.id,
      value: 9.5,
      note: '  After update  '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementResponseDto
    expect(payload.id).toBe(measurement.id)
    expect(payload.experimentId).toBe(experiment.id)
    expect(payload.metricId).toBe(metric.id)
    expect(payload.value).toBe(9.5)
    expect(payload.note).toBe('After update')

    const storedMeasurement = await prisma.measurement.findUnique({
      where: { id: measurement.id }
    })

    expect(storedMeasurement?.metricId).toBe(metric.id)
    expect(Number(storedMeasurement?.value)).toBe(9.5)
    expect(storedMeasurement?.note).toBe('After update')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-update-invalid',
      name: 'Measurements Update Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await updateMeasurementWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid', 'yet-again-not-a-uuid', {
      metricId: 'still-not-a-uuid',
      value: 9.5,
      note: null
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to update the measurement', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-update-owner-b',
      name: 'Measurements Update Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-update-attacker',
      name: 'Measurements Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for measurement update',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected measurement update hypothesis',
        dimension: 'PROBLEM',
        priority: 'LOW',
        evidenceType: 'QUANTITATIVE'
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

    const measurement = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metric.id,
        value: 4,
        note: null
      }
    })

    const response = await updateMeasurementWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, measurement.id, {
      metricId: metric.id,
      value: 8,
      note: 'Attack update'
    })

    expect(response.status).toBe(404)
  })

  it('returns 404 when updating a measurement with a metric outside the hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-update-conflict',
      name: 'Measurements Update Conflict'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement update conflict',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Measurement update conflict hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
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

    const measurement = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metric.id,
        value: 10,
        note: null
      }
    })

    const response = await updateMeasurementWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, measurement.id, {
      metricId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      value: 12,
      note: 'Unknown metric in hypothesis'
    })

    expect(response.status).toBe(404)

    const unchangedMeasurement = await prisma.measurement.findUnique({
      where: { id: measurement.id }
    })

    expect(unchangedMeasurement?.metricId).toBe(metric.id)
  })
})
