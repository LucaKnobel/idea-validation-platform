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

describe('DELETE /api/ideas/:id/versions/:versionId/hypotheses/:hypothesisId/experiments/:experimentId integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteExperimentWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    hypothesisId: string,
    experimentId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/hypotheses/${hypothesisId}/experiments/${experimentId}`), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for experiment deletion', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/hypotheses/${randomUUID()}/experiments/${randomUUID()}`), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes an owned experiment and removes it from the database', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-delete-owner',
      name: 'Experiments Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Idea for experiment deletion',
      description: 'Fixture idea version'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Delete experiment hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH'
      }
    })

    const experiment = await prisma.experiment.create({
      data: {
        hypothesisId: hypothesis.id,
        title: 'Delete Me',
        description: 'Experiment scheduled for deletion',
        status: 'RUNNING'
      }
    })

    const response = await deleteExperimentWithCookie(user.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id)

    expect(response.status).toBe(204)

    const deletedExperiment = await prisma.experiment.findUnique({
      where: { id: experiment.id }
    })

    expect(deletedExperiment).toBeNull()
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-delete-invalid',
      name: 'Experiments Delete Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteExperimentWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid', 'still-not-a-uuid', 'nope-not-a-uuid')

    expect(response.status).toBe(400)
  })

  it('returns 404 when another user tries to delete the experiment', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-delete-owner-b',
      name: 'Experiments Delete Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'experiments-delete-attacker',
      name: 'Experiments Delete Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const createdVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private idea version for experiment delete',
      description: 'Private'
    })

    const hypothesis = await prisma.hypothesis.create({
      data: {
        ideaVersionId: createdVersion.ideaVersionId,
        statement: 'Protected experiment hypothesis',
        dimension: 'MONETIZATION',
        priority: 'MEDIUM'
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

    const response = await deleteExperimentWithCookie(attacker.cookieHeader, createdVersion.ideaId, createdVersion.ideaVersionId, hypothesis.id, experiment.id)

    expect(response.status).toBe(404)

    const stillExisting = await prisma.experiment.findUnique({
      where: { id: experiment.id }
    })

    expect(stillExisting).not.toBeNull()
  })
})
