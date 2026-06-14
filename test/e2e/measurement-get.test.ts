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

describe('GET /api/hypotheses/:hypothesisId/measurement integration', async () => {
  await setup(getE2ESetupOptions())

  const getMeasurementWithCookie = async (
    cookieHeader: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/measurement`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/measurement`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns the measurement singleton for an owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-get-owner',
      name: 'Measurements Get Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Measurement get version',
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

    const measurement = await prisma.measurement.create({
      data: {
        hypothesisId: hypothesis.id,
        value: 12.5,
        note: 'First cohort'
      }
    })

    const response = await getMeasurementWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementResponseDto

    expect(payload.id).toBe(measurement.id)
    expect(payload.value).toBe(12.5)
    expect(payload.note).toBe('First cohort')
  })

  it('returns 400 for invalid hypothesisId route param', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-get-invalid',
      name: 'Measurements Get Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getMeasurementWithCookie(user.cookieHeader, 'nope-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when measurement does not exist for owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-get-missing',
      name: 'Measurements Get Missing'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Private idea version without measurement',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Hypothesis without measurement',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await getMeasurementWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(404)
  })

  it('returns 404 for another users hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-get-owner-b',
      name: 'Measurements Get Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurements-get-attacker',
      name: 'Measurements Get Attacker'
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
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
      }
    })

    await prisma.measurement.create({
      data: {
        hypothesisId: hypothesis.id,
        value: 3,
        note: null
      }
    })

    const response = await getMeasurementWithCookie(attacker.cookieHeader, hypothesis.id)

    expect(response.status).toBe(404)
  })
})
