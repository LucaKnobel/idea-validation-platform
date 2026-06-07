import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { ExperimentsListResponseDto } from '@infrastructure/validation/experiment-schemas'
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

describe('GET /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments integration', async () => {
  await setup(getE2ESetupOptions())

  const getExperimentsWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for experiment listing', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/experiments`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns only experiments owned by the authenticated user', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-list-owner',
      name: 'Experiments List Owner'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-list-attacker',
      name: 'Experiments List Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Owner experiments version',
      description: 'Owner fixture'
    })

    const attackerVersion = await createIdeaVersionForUser({
      userId: attacker.id,
      title: 'Attacker experiments version',
      description: 'Attacker fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Owner hypothesis for experiments',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const attackerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: attackerVersion.ideaVersionId,
        statement: 'Attacker hypothesis for experiments',
        dimension: 'SOLUTION',
        priority: 'LOW'
      }
    })

    const ownerExperiment = await prisma.experiment.create({
      data: {
        hypothesisId: ownerHypothesis.id,
        title: 'Landing Page Test',
        description: 'Validate the onboarding headline.',
        status: 'PLANNED'
      }
    })

    await prisma.experiment.create({
      data: {
        hypothesisId: attackerHypothesis.id,
        title: 'Attacker Experiment',
        description: null,
        status: 'CANCELLED'
      }
    })

    const response = await getExperimentsWithCookie(owner.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId, ownerHypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as ExperimentsListResponseDto

    expect(payload.items).toHaveLength(1)
    expect(payload.items[0]?.id).toBe(ownerExperiment.id)
    expect(payload.items[0]?.title).toBe('Landing Page Test')
    expect(payload.items[0]?.description).toBe('Validate the onboarding headline.')
    expect(payload.items[0]?.status).toBe('PLANNED')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-list-invalid',
      name: 'Experiments List Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getExperimentsWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user requests another users hypothesis experiments', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-list-owner-b',
      name: 'Experiments List Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-list-attacker-b',
      name: 'Experiments List Attacker B'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownerVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private experiments version',
      description: 'Private fixture'
    })

    const ownerHypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: ownerVersion.ideaVersionId,
        statement: 'Private experiments hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM'
      }
    })

    await prisma.experiment.create({
      data: {
        hypothesisId: ownerHypothesis.id,
        title: 'Private Experiment',
        description: null,
        status: 'RUNNING'
      }
    })

    const response = await getExperimentsWithCookie(attacker.cookieHeader, ownerVersion.ideaId, ownerVersion.ideaVersionId, ownerHypothesis.id)

    expect(response.status).toBe(404)
  })
})
