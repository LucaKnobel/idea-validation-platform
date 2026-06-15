import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { IdeaVersionValidationOverviewResponseDto } from '@infrastructure/validation/idea-version-validation-overview-schemas'
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

describe('GET /api/ideas/:id/versions/:versionId/validation integration', async () => {
  await setup(getE2ESetupOptions())

  const getValidationWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/validation`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for loading the validation overview', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/validation`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns aggregated validation data for one owned idea version', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'overview-owner',
      name: 'Overview Owner'
    })
    const owner = expectAuthenticatedSessionCreated(ownerResult)

    const version = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Overview idea version',
      description: 'Fixture version'
    })

    await prisma.hypothesis.createMany({
      data: [
        {
          ideaVersionId: version.ideaVersionId,
          statement: 'Problem hypothesis 1',
          dimension: 'PROBLEM',
          priority: 'HIGH',
          evidenceType: 'QUALITATIVE',
          status: 'VALIDATED'
        },
        {
          ideaVersionId: version.ideaVersionId,
          statement: 'Problem hypothesis 2',
          dimension: 'PROBLEM',
          priority: 'LOW',
          evidenceType: 'MONETARY',
          status: 'VALIDATED'
        },
        {
          ideaVersionId: version.ideaVersionId,
          statement: 'Market hypothesis 1',
          dimension: 'MARKET',
          priority: 'MEDIUM',
          evidenceType: 'QUANTITATIVE',
          status: 'INVALIDATED'
        },
        {
          ideaVersionId: version.ideaVersionId,
          statement: 'Market hypothesis 2',
          dimension: 'MARKET',
          priority: 'LOW',
          evidenceType: 'BEHAVIORAL',
          status: 'NOT_TESTED'
        },
        {
          ideaVersionId: version.ideaVersionId,
          statement: 'Execution hypothesis',
          dimension: 'EXECUTION',
          priority: 'HIGH',
          evidenceType: 'MONETARY',
          status: 'VALIDATED'
        }
      ]
    })

    const response = await getValidationWithCookie(owner.cookieHeader, version.ideaId, version.ideaVersionId)

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionValidationOverviewResponseDto

    expect(payload).toMatchObject({
      ideaId: version.ideaId,
      ideaVersionId: version.ideaVersionId,
      totalHypotheses: 5,
      statusCounts: {
        validated: 3,
        invalidated: 1,
        notTested: 1
      },
      priorityCounts: {
        high: 2,
        medium: 1,
        low: 2
      },
      evidenceCounts: {
        qualitative: 1,
        quantitative: 1,
        behavioral: 1,
        monetary: 2
      }
    })

    expect(payload.dimensionCards).toHaveLength(5)
    expect(payload.dimensionCards.find(card => card.dimension === 'PROBLEM')).toMatchObject({
      statusCounts: {
        validated: 2,
        invalidated: 0,
        notTested: 0
      }
    })
    expect(payload.dimensionCards.find(card => card.dimension === 'MARKET')).toMatchObject({
      statusCounts: {
        validated: 0,
        invalidated: 1,
        notTested: 1
      }
    })
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'overview-invalid',
      name: 'Overview Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getValidationWithCookie(user.cookieHeader, 'not-a-uuid', 'still-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user requests a private overview', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'overview-private-owner',
      name: 'Overview Private Owner'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'overview-private-attacker',
      name: 'Overview Private Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const version = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private overview version',
      description: 'Private fixture'
    })

    await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Private overview hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE',
        status: 'VALIDATED'
      }
    })

    const response = await getValidationWithCookie(attacker.cookieHeader, version.ideaId, version.ideaVersionId)

    expect(response.status).toBe(404)
  })
})
