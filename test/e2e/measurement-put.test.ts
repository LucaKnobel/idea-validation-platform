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

describe('PUT /api/hypotheses/:hypothesisId/measurement integration', async () => {
  await setup(getE2ESetupOptions())

  const upsertMeasurementWithCookie = async (
    cookieHeader: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/measurement`), {
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
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/measurement`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        value: 12.5,
        note: 'First cohort'
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates a measurement when missing (upsert create path)', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurement-upsert-create-owner',
      name: 'Measurement Upsert Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement upsert create',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Create measurement by put',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await upsertMeasurementWithCookie(user.cookieHeader, hypothesis.id, {
      value: 12.5,
      note: '  First cohort  '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementResponseDto
    expect(payload.value).toBe(12.5)
    expect(payload.note).toBe('First cohort')

    const storedMeasurement = await prisma.measurement.findUnique({
      where: { id: payload.id }
    })

    expect(storedMeasurement).not.toBeNull()
    expect(storedMeasurement?.hypothesisId).toBe(hypothesis.id)
    expect(Number(storedMeasurement?.value)).toBe(12.5)
    expect(storedMeasurement?.note).toBe('First cohort')
  })

  it('updates an owned measurement (upsert update path)', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurement-upsert-update-owner',
      name: 'Measurement Upsert Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for measurement upsert update',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Update measurement by put',
        dimension: 'MONETIZATION',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const measurement = await prisma.measurement.create({
      data: {
        hypothesisId: hypothesis.id,
        value: 6,
        note: 'Before update'
      }
    })

    const response = await upsertMeasurementWithCookie(user.cookieHeader, hypothesis.id, {
      value: 9.5,
      note: '  After update  '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as MeasurementResponseDto
    expect(payload.id).toBe(measurement.id)
    expect(payload.value).toBe(9.5)
    expect(payload.note).toBe('After update')

    const storedMeasurement = await prisma.measurement.findUnique({
      where: { id: measurement.id }
    })

    expect(Number(storedMeasurement?.value)).toBe(9.5)
    expect(storedMeasurement?.note).toBe('After update')
  })

  it('returns 400 for invalid hypothesisId route param', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'measurement-upsert-invalid',
      name: 'Measurement Upsert Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await upsertMeasurementWithCookie(user.cookieHeader, 'not-a-uuid', {
      value: 9.5,
      note: null
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to upsert the measurement', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'measurement-upsert-owner-b',
      name: 'Measurement Upsert Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'measurement-upsert-attacker',
      name: 'Measurement Upsert Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for measurement upsert',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected measurement hypothesis',
        dimension: 'PROBLEM',
        priority: 'LOW',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await upsertMeasurementWithCookie(attacker.cookieHeader, hypothesis.id, {
      value: 8,
      note: 'Attack update'
    })

    expect(response.status).toBe(404)
  })
})
