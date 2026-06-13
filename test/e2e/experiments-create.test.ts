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

describe('POST /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments integration', async () => {
  await setup(getE2ESetupOptions())

  const createExperimentWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for experiment creation', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/experiments`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Landing Page Test',
        description: 'Validate the onboarding headline.',
        status: 'PLANNED'
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates an experiment for the authenticated owner', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-create-owner',
      name: 'Experiments Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for experiment creation',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will convert better with experiments.',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await createExperimentWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, {
      title: '  Landing Page Test  ',
      description: '  Validate the onboarding headline.  ',
      status: 'PLANNED'
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as ExperimentResponseDto

    expect(payload.hypothesisId).toBe(hypothesis.id)
    expect(payload.title).toBe('Landing Page Test')
    expect(payload.description).toBe('Validate the onboarding headline.')
    expect(payload.status).toBe('PLANNED')

    const storedExperiment = await prisma.experiment.findUnique({
      where: { id: payload.id }
    })

    expect(storedExperiment).not.toBeNull()
    expect(storedExperiment?.title).toBe('Landing Page Test')
    expect(storedExperiment?.description).toBe('Validate the onboarding headline.')
    expect(storedExperiment?.status).toBe('PLANNED')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-create-invalid',
      name: 'Experiments Create Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await createExperimentWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', {
      title: 'Landing Page Test',
      description: null,
      status: 'PLANNED'
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when an authenticated user creates an experiment in another users hypothesis', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-create-owner-b',
      name: 'Experiments Create Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-create-attacker',
      name: 'Experiments Create Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for experiment create',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected experiment hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const response = await createExperimentWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, {
      title: 'Attack Experiment',
      description: null,
      status: 'RUNNING'
    })

    expect(response.status).toBe(404)

    const storedExperiments = await prisma.experiment.findMany({
      where: { hypothesisId: hypothesis.id }
    })

    expect(storedExperiments).toHaveLength(0)
  })
})
