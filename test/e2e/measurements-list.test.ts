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

describe('GET /api/measurements/:measurementId integration', async () => {
  await setup(getE2ESetupOptions())

  const getMeasurementWithCookie = async (cookieHeader: string, measurementId: string): Promise<Response> => {
    return fetch(url(`/api/measurements/${measurementId}`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for measurement loading', async () => {
    const response = await fetch(url(`/api/measurements/${randomUUID()}`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns one owned measurement', async () => {
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
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
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

    const measurementA = await prisma.measurement.create({
      data: {
        experimentId: experiment.id,
        metricId: metricA.id,
        value: 12.5,
        note: 'First cohort'
      }
    })

    const response = await getMeasurementWithCookie(user.cookieHeader, measurementA.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementResponseDto

    expect(payload.id).toBe(measurementA.id)
    expect(payload.experimentId).toBe(experiment.id)
    expect(payload.metricId).toBe(metricA.id)
    expect(payload.value).toBe(12.5)
    expect(payload.note).toBe('First cohort')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-list-invalid',
      name: 'Measurements List Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getMeasurementWithCookie(user.cookieHeader, 'nope-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user requests another users measurement', async () => {
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
        priority: 'MEDIUM',
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
        value: 3,
        note: null
      }
    })

    const response = await getMeasurementWithCookie(attacker.cookieHeader, measurement.id)

    expect(response.status).toBe(404)
  })
})
