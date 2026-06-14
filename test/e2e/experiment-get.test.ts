import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { ExperimentResponseDto } from '@infrastructure/validation/experiment-schemas'
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

describe('GET /api/hypotheses/:hypothesisId/experiment integration', async () => {
  await setup(getE2ESetupOptions())

  const getExperimentWithCookie = async (
    cookieHeader: string,
    hypothesisId: string
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/experiment`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/experiment`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns the experiment singleton for an owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-get-owner',
      name: 'Experiments Get Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Experiment get version',
      description: 'Owned fixture'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Owned hypothesis for experiment get',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const createdExperiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Landing Page Test',
        description: 'Validate the onboarding headline.',
        status: 'PLANNED'
      }
    })

    const response = await getExperimentWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(200)

    const payload = await response.json() as ExperimentResponseDto
    expect(payload.id).toBe(createdExperiment.id)
    expect(payload.title).toBe('Landing Page Test')
    expect(payload.description).toBe('Validate the onboarding headline.')
    expect(payload.status).toBe('PLANNED')
  })

  it('returns 400 for invalid hypothesisId route param', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-get-invalid',
      name: 'Experiments Get Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getExperimentWithCookie(user.cookieHeader, 'not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when experiment does not exist for owned hypothesis', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-get-missing',
      name: 'Experiments Get Missing'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Experiment missing version',
      description: 'No experiment fixture'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: version.ideaVersionId,
        statement: 'Owned hypothesis without experiment',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await getExperimentWithCookie(user.cookieHeader, hypothesis.id)

    expect(response.status).toBe(404)
  })

  it('returns 404 for another users hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-get-owner-b',
      name: 'Experiments Get Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-get-attacker-b',
      name: 'Experiments Get Attacker B'
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
        dimension: 'SOLUTION',
        priority: 'LOW',
        evidenceType: 'QUALITATIVE'
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

    const response = await getExperimentWithCookie(attacker.cookieHeader, ownerHypothesis.id)

    expect(response.status).toBe(404)
  })
})
