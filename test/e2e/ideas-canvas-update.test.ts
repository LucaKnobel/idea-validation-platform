import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'
import type { IdeaVersionCanvasResponseDto, ReplaceIdeaVersionCanvasBodyDto } from '@shared/types/canvas'

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

describe('PUT /api/ideas/:id/versions/:versionId/canvas integration', async () => {
  await setup(getE2ESetupOptions())

  const putCanvasWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    body: ReplaceIdeaVersionCanvasBodyDto
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}/canvas`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication for canvas updates', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}/canvas`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ elements: [] })
    })

    expect(response.status).toBe(401)
  })

  it('replaces the authenticated users canvas snapshot and persists trimmed content', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-update-owner',
      name: 'Ideas Canvas Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const ideaVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Canvas update fixture',
      canvasElements: [
        { type: 'KEY_PARTNERS', content: 'Old partner' }
      ]
    })

    const response = await putCanvasWithCookie(user.cookieHeader, ideaVersion.ideaId, ideaVersion.ideaVersionId, {
      elements: [
        { type: 'KEY_PARTNERS', content: '  New strategic partner  ' },
        { type: 'CHANNELS', content: '  Direct sales  ' }
      ]
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionCanvasResponseDto

    expect(payload.elements).toHaveLength(2)
    expect(payload.elements.map(element => element.type)).toEqual(expect.arrayContaining(['KEY_PARTNERS', 'CHANNELS']))
    expect(payload.elements.map(element => element.content)).toEqual(expect.arrayContaining(['New strategic partner', 'Direct sales']))

    const storedCanvas = await prisma.canvasElement.findMany({
      where: { ideaVersionId: ideaVersion.ideaVersionId }
    })

    expect(storedCanvas).toHaveLength(2)
    expect(storedCanvas.map(element => element.content)).toEqual(expect.arrayContaining(['New strategic partner', 'Direct sales']))
    expect(storedCanvas.some(element => element.content === 'Old partner')).toBe(false)
  })

  it('returns 404 for another users idea version and keeps existing canvas unchanged', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-update-owner-b',
      name: 'Ideas Canvas Update Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-update-attacker',
      name: 'Ideas Canvas Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ideaVersion = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Protected canvas update fixture',
      canvasElements: [
        { type: 'VALUE_PROPOSITIONS', content: 'Owners original proposition' }
      ]
    })

    const response = await putCanvasWithCookie(attacker.cookieHeader, ideaVersion.ideaId, ideaVersion.ideaVersionId, {
      elements: [
        { type: 'VALUE_PROPOSITIONS', content: 'Attack overwrite attempt' }
      ]
    })

    expect(response.status).toBe(404)

    const storedCanvas = await prisma.canvasElement.findMany({
      where: { ideaVersionId: ideaVersion.ideaVersionId }
    })

    expect(storedCanvas).toHaveLength(1)
    expect(storedCanvas[0]?.content).toBe('Owners original proposition')
  })

  it('rejects invalid payloads with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-canvas-update-invalid-body',
      name: 'Ideas Canvas Update Invalid Body'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const ideaVersion = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Invalid payload fixture'
    })

    const response = await putCanvasWithCookie(user.cookieHeader, ideaVersion.ideaId, ideaVersion.ideaVersionId, {
      elements: [
        { type: 'KEY_PARTNERS', content: ' '.repeat(2) }
      ]
    })

    expect(response.status).toBe(400)
  })
})
