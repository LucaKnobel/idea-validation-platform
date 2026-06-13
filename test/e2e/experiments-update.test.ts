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

describe('PUT /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments/:experimentId integration', async () => {
  await setup(getE2ESetupOptions())

  const updateExperimentWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    experimentId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments/${experimentId}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('updates an owned experiment', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-update-owner',
      name: 'Experiments Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for experiment update',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Users will convert better with experiments.',
        dimension: 'MONETIZATION',
        priority: 'HIGH',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Initial Experiment',
        description: 'Initial description',
        status: 'PLANNED'
      }
    })

    const response = await updateExperimentWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, {
      title: '  Updated Experiment  ',
      description: '  Validate the new hypothesis setup.  ',
      status: 'RUNNING'
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as ExperimentResponseDto

    expect(payload.id).toBe(experiment.id)
    expect(payload.hypothesisId).toBe(hypothesis.id)
    expect(payload.title).toBe('Updated Experiment')
    expect(payload.description).toBe('Validate the new hypothesis setup.')
    expect(payload.status).toBe('RUNNING')

    const storedExperiment = await prisma.experiment.findUnique({
      where: { id: experiment.id }
    })

    expect(storedExperiment?.title).toBe('Updated Experiment')
    expect(storedExperiment?.description).toBe('Validate the new hypothesis setup.')
    expect(storedExperiment?.status).toBe('RUNNING')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-update-invalid',
      name: 'Experiments Update Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await updateExperimentWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid', {
      title: 'Updated Experiment',
      description: null,
      status: 'RUNNING'
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to update the experiment', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-update-owner-b',
      name: 'Experiments Update Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-update-attacker',
      name: 'Experiments Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for experiment update',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected experiment hypothesis',
        dimension: 'PROBLEM',
        priority: 'LOW',
        evidenceType: 'QUANTITATIVE'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Protected Experiment',
        description: null,
        status: 'PLANNED'
      }
    })

    const response = await updateExperimentWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id, {
      title: 'Attack Experiment',
      description: null,
      status: 'CANCELLED'
    })

    expect(response.status).toBe(404)
  })
})
