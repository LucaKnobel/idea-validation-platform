import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import type { IdeaVersionMetadataDto } from '@infrastructure/validation/idea-schemas'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createIdeaForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('POST /api/ideas/:id/versions integration', async () => {
  await setup(getE2ESetupOptions())

  const postIdeaVersionWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions`), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions`), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ baseVersionId: randomUUID(), type: 'ITERATION' })
    })

    expect(response.status).toBe(401)
  })

  it('rejects invalid route params and body with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-post-invalid',
      name: 'Idea Versions Post Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const invalidRouteResponse = await postIdeaVersionWithCookie(user.cookieHeader, 'not-a-uuid', {
      baseVersionId: randomUUID(),
      type: 'ITERATION'
    })
    expect(invalidRouteResponse.status).toBe(400)

    const invalidBodyResponse = await postIdeaVersionWithCookie(user.cookieHeader, randomUUID(), {
      baseVersionId: 'not-a-uuid',
      type: 'INITIAL'
    })
    expect(invalidBodyResponse.status).toBe(400)
  })

  it('creates an iteration and copies all hypotheses with their children', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-post-iteration',
      name: 'Idea Versions Post Iteration'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Iteration source idea'
    })

    const baseVersion = await prisma.ideaVersion.findFirstOrThrow({
      where: { ideaId: idea.id },
      orderBy: { versionNumber: 'asc' }
    })

    await prisma.canvasElement.createMany({
      data: [
        { ideaVersionId: baseVersion.id, type: 'CHANNELS', content: 'Channel A' },
        { ideaVersionId: baseVersion.id, type: 'KEY_PARTNERS', content: 'Partner X' }
      ]
    })

    const h1 = await prisma.hypothesis.create({
      data: {
        ideaVersionId: baseVersion.id,
        statement: 'Validated hypothesis',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE',
        status: 'VALIDATED'
      }
    })

    const h2 = await prisma.hypothesis.create({
      data: {
        ideaVersionId: baseVersion.id,
        statement: 'Invalidated hypothesis',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE',
        status: 'INVALIDATED'
      }
    })

    await prisma.hypothesisCanvasSection.createMany({
      data: [
        { hypothesisId: h1.id, canvasElementType: 'CHANNELS' },
        { hypothesisId: h2.id, canvasElementType: 'KEY_PARTNERS' }
      ]
    })

    await prisma.metric.create({
      data: {
        hypothesisId: h1.id,
        name: 'Conversion',
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

    await prisma.experiment.create({
      data: {
        hypothesisId: h1.id,
        title: 'Experiment A',
        description: null,
        status: 'PLANNED'
      }
    })

    await prisma.measurement.create({
      data: {
        hypothesisId: h1.id,
        value: 12,
        note: 'Good result'
      }
    })

    const response = await postIdeaVersionWithCookie(user.cookieHeader, idea.id, {
      baseVersionId: baseVersion.id,
      type: 'ITERATION'
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as IdeaVersionMetadataDto
    expect(payload.type).toBe('ITERATION')
    expect(payload.parentVersionId).toBe(baseVersion.id)

    const createdVersion = await prisma.ideaVersion.findUniqueOrThrow({ where: { id: payload.id } })
    const copiedCanvasCount = await prisma.canvasElement.count({ where: { ideaVersionId: createdVersion.id } })
    const copiedHypotheses = await prisma.hypothesis.findMany({ where: { ideaVersionId: createdVersion.id } })

    expect(copiedCanvasCount).toBe(2)
    expect(copiedHypotheses).toHaveLength(2)

    const copiedMetrics = await prisma.metric.count({
      where: {
        hypothesis: {
          ideaVersionId: createdVersion.id
        }
      }
    })

    const copiedExperiments = await prisma.experiment.count({
      where: {
        hypothesis: {
          ideaVersionId: createdVersion.id
        }
      }
    })

    const copiedMeasurements = await prisma.measurement.count({
      where: {
        hypothesis: {
          ideaVersionId: createdVersion.id
        }
      }
    })

    expect(copiedMetrics).toBe(1)
    expect(copiedExperiments).toBe(1)
    expect(copiedMeasurements).toBe(1)
  })

  it('creates a pivot and excludes invalidated hypotheses and children', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-post-pivot',
      name: 'Idea Versions Post Pivot'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Pivot source idea'
    })

    const baseVersion = await prisma.ideaVersion.findFirstOrThrow({
      where: { ideaId: idea.id },
      orderBy: { versionNumber: 'asc' }
    })

    const keep = await prisma.hypothesis.create({
      data: {
        ideaVersionId: baseVersion.id,
        statement: 'Keep me',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE',
        status: 'NOT_TESTED'
      }
    })

    const drop = await prisma.hypothesis.create({
      data: {
        ideaVersionId: baseVersion.id,
        statement: 'Drop me',
        dimension: 'MARKET',
        priority: 'LOW',
        evidenceType: 'MONETARY',
        status: 'INVALIDATED'
      }
    })

    await prisma.metric.create({
      data: {
        hypothesisId: keep.id,
        name: 'Kept metric',
        description: null,
        unit: null,
        threshold: { create: { operator: 'GTE', referenceValue: 1 } }
      }
    })

    await prisma.metric.create({
      data: {
        hypothesisId: drop.id,
        name: 'Dropped metric',
        description: null,
        unit: null,
        threshold: { create: { operator: 'GTE', referenceValue: 1 } }
      }
    })

    await prisma.experiment.create({
      data: {
        hypothesisId: keep.id,
        title: 'Kept experiment',
        description: null,
        status: 'PLANNED'
      }
    })

    await prisma.experiment.create({
      data: {
        hypothesisId: drop.id,
        title: 'Dropped experiment',
        description: null,
        status: 'PLANNED'
      }
    })

    await prisma.measurement.create({
      data: {
        hypothesisId: keep.id,
        value: 11,
        note: 'Kept measurement'
      }
    })

    await prisma.measurement.create({
      data: {
        hypothesisId: drop.id,
        value: 3,
        note: 'Dropped measurement'
      }
    })

    const response = await postIdeaVersionWithCookie(user.cookieHeader, idea.id, {
      baseVersionId: baseVersion.id,
      type: 'PIVOT'
    })

    expect(response.status).toBe(201)

    const payload = await response.json() as IdeaVersionMetadataDto
    expect(payload.type).toBe('PIVOT')

    const keptCount = await prisma.hypothesis.count({
      where: {
        ideaVersionId: payload.id,
        statement: 'Keep me'
      }
    })

    const droppedCount = await prisma.hypothesis.count({
      where: {
        ideaVersionId: payload.id,
        statement: 'Drop me'
      }
    })

    expect(keptCount).toBe(1)
    expect(droppedCount).toBe(0)

    const copiedMetrics = await prisma.metric.count({
      where: {
        hypothesis: {
          ideaVersionId: payload.id
        }
      }
    })

    const copiedExperiments = await prisma.experiment.count({
      where: {
        hypothesis: {
          ideaVersionId: payload.id
        }
      }
    })

    const copiedMeasurements = await prisma.measurement.count({
      where: {
        hypothesis: {
          ideaVersionId: payload.id
        }
      }
    })

    expect(copiedMetrics).toBe(1)
    expect(copiedExperiments).toBe(1)
    expect(copiedMeasurements).toBe(1)
  })

  it('returns 404 when trying to derive from a foreign base version', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-post-owner-private',
      name: 'Idea Versions Post Owner Private'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-versions-post-attacker',
      name: 'Idea Versions Post Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownersIdea = await createIdeaForUser({
      userId: owner.id,
      title: 'Private source'
    })

    const baseVersion = await prisma.ideaVersion.findFirstOrThrow({
      where: { ideaId: ownersIdea.id },
      orderBy: { versionNumber: 'asc' }
    })

    const response = await postIdeaVersionWithCookie(attacker.cookieHeader, ownersIdea.id, {
      baseVersionId: baseVersion.id,
      type: 'ITERATION'
    })

    expect(response.status).toBe(404)
  })
})
