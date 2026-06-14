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

describe('PUT /api/hypotheses/:hypothesisId/experiment integration', async () => {
  await setup(getE2ESetupOptions())

  const upsertExperimentWithCookie = async (
    cookieHeader: string,
    hypothesisId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/hypotheses/${hypothesisId}/experiment`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        cookie: cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/hypotheses/${randomUUID()}/experiment`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Landing Page Test',
        description: 'Validate onboarding headline.',
        status: 'PLANNED'
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates an experiment when missing (upsert create path)', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiment-upsert-create-owner',
      name: 'Experiment Upsert Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for experiment upsert create',
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

    const response = await upsertExperimentWithCookie(user.cookieHeader, hypothesis.id, {
      title: '  Landing Page Test  ',
      description: '  Validate the onboarding headline.  ',
      status: 'PLANNED'
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as ExperimentResponseDto

    expect(payload.title).toBe('Landing Page Test')
    expect(payload.description).toBe('Validate the onboarding headline.')
    expect(payload.status).toBe('PLANNED')

    const storedExperiment = await prisma.experiment.findUnique({
      where: { id: payload.id }
    })

    expect(storedExperiment).not.toBeNull()
    expect(storedExperiment?.hypothesisId).toBe(hypothesis.id)
    expect(storedExperiment?.title).toBe('Landing Page Test')
    expect(storedExperiment?.description).toBe('Validate the onboarding headline.')
    expect(storedExperiment?.status).toBe('PLANNED')
  })

  it('updates an existing experiment (upsert update path)', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiment-upsert-update-owner',
      name: 'Experiment Upsert Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for experiment upsert update',
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

    const response = await upsertExperimentWithCookie(user.cookieHeader, hypothesis.id, {
      title: '  Updated Experiment  ',
      description: '  Validate the new hypothesis setup.  ',
      status: 'RUNNING'
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as ExperimentResponseDto

    expect(payload.id).toBe(experiment.id)
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
      emailPrefix: 'experiment-upsert-invalid',
      name: 'Experiment Upsert Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await upsertExperimentWithCookie(user.cookieHeader, 'still-not-a-uuid', {
      title: 'Updated Experiment',
      description: null,
      status: 'RUNNING'
    })

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to upsert the experiment', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiment-upsert-owner-b',
      name: 'Experiment Upsert Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiment-upsert-attacker',
      name: 'Experiment Upsert Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for experiment upsert',
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

    const response = await upsertExperimentWithCookie(attacker.cookieHeader, hypothesis.id, {
      title: 'Attack Experiment',
      description: null,
      status: 'CANCELLED'
    })

    expect(response.status).toBe(404)
  })
})
