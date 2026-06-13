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

describe('DELETE /api/measurements/:measurementId integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteMeasurementWithCookie = async (
    cookieHeader: string,
    measurementId: string
  ): Promise<Response> => {
    return fetch(url(`/api/measurements/${measurementId}`), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for measurement deletion', async () => {
    const response = await fetch(url(`/api/measurements/${randomUUID()}`), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes an owned measurement and removes it from the database', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-delete-owner',
      name: 'Measurements Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement deletion',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Delete measurement hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Delete Measurement Experiment',
        description: null,
        status: 'RUNNING'
      }
    })

    const metric = await prisma.metric.create({
      data: {
        hypothesisId: hypothesis.id,
        name: 'Delete Metric',
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
        value: 7,
        note: 'Delete me'
      }
    })

    const response = await deleteMeasurementWithCookie(user.cookieHeader, measurement.id)

    expect(response.status).toBe(204)

    const deletedMeasurement = await prisma.measurement.findUnique({
      where: { id: measurement.id }
    })

    expect(deletedMeasurement).toBeNull()
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-delete-invalid',
      name: 'Measurements Delete Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteMeasurementWithCookie(user.cookieHeader, 'again-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to delete the measurement', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-delete-owner-b',
      name: 'Measurements Delete Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-delete-attacker',
      name: 'Measurements Delete Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for measurement delete',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected measurement delete hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
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

    const measurement = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metric.id,
        value: 3,
        note: null
      }
    })

    const response = await deleteMeasurementWithCookie(attacker.cookieHeader, measurement.id)

    expect(response.status).toBe(404)

    const stillExisting = await prisma.measurement.findUnique({
      where: { id: measurement.id }
    })

    expect(stillExisting).not.toBeNull()
  })
})
