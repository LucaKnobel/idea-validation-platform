import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'
import type { IdeaVersionCanvasResponseDto } from '@shared/types/canvas'

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

describe('GET /api/ideas/:id/versions/:versionId/canvas integration', async () => {
  await setup(getE2ESetupOptions())

  const getCanvasWithCookie = async (cookieHeader: string, ideaId: string, versionId: string): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/canvas`), {
      method: 'GET',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for canvas reads', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/canvas`), {
      method: 'GET'
    })

    expect(response.status).toBe(401)
  })

  it('returns the authenticated users canvas entries as a DTO response', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-get-owner',
      name: 'Ideas Canvas Get Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const ideaVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Canvas fixture',
      canvasElements: [
        { type: 'KEY_PARTNERS', content: 'Strategic suppliers' },
        { type: 'CHANNELS', content: 'Direct sales' }
      ]
    })

    const response = await getCanvasWithCookie(user.cookieHeader, ideaVersion.ideaId, ideaVersion.ideaVersionId)

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionCanvasResponseDto

    expect(payload.elements).toHaveLength(2)
    expect(payload.elements.every(element => element.ideaVersionId === ideaVersion.ideaVersionId)).toBe(true)
    expect(payload.elements.map(element => element.type)).toEqual(expect.arrayContaining(['KEY_PARTNERS', 'CHANNELS']))
    expect(payload.elements.map(element => element.content)).toEqual(expect.arrayContaining(['Strategic suppliers', 'Direct sales']))
    expect(payload.elements.every(element => Boolean(element.id))).toBe(true)
    expect(payload.elements.every(element => Boolean(element.createdAt))).toBe(true)
    expect(payload.elements.every(element => Boolean(element.updatedAt))).toBe(true)
  })

  it('returns 404 for another users idea version and does not leak canvas data', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-get-owner-b',
      name: 'Ideas Canvas Get Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-get-attacker',
      name: 'Ideas Canvas Get Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ideaVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Protected canvas fixture',
      canvasElements: [
        { type: 'VALUE_PROPOSITIONS', content: 'Confidential value proposition' }
      ]
    })

    const response = await getCanvasWithCookie(attacker.cookieHeader, ideaVersion.ideaId, ideaVersion.ideaVersionId)

    expect(response.status).toBe(404)

    const storedCanvas = await prisma.canvasElement.findMany({
      where: { ideaVersionId: ideaVersion.ideaVersionId }
    })

    expect(storedCanvas).toHaveLength(1)
    expect(storedCanvas[0]?.content).toBe('Confidential value proposition')
  })

  it('rejects invalid route params with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-get-invalid-id',
      name: 'Ideas Canvas Get Invalid Id'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await getCanvasWithCookie(user.cookieHeader, 'not-a-uuid', 'also-not-a-uuid')

    expect(response.status).toBe(400)
  })
})
