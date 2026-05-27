import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'
import type { IdeaResponseDto } from '@shared/types/idea'

import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getE2ESetupOptions
} from './auth-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('POST /api/ideas integration', async () => {
  await setup(getE2ESetupOptions())

  const postIdea = async (
    cookieHeader: string,
    input: { title: string, description?: string }
  ): Promise<Response> => {
    return fetch(url('/api/ideas'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(input)
    })
  }

  it('requires authentication for idea creation', async () => {
    const response = await fetch(url('/api/ideas'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Unauthenticated create attempt'
      })
    })

    expect(response.status).toBe(401)
  })

  it('creates an idea for the authenticated user and returns a DTO response', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-create-owner',
      name: 'Ideas Create Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await postIdea(user.cookieHeader, {
      title: '  MVP discovery board  ',
      description: '  First idea draft  '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaResponseDto

    expect(payload.id).toBeTruthy()
    expect(payload.title).toBe('MVP discovery board')
    expect(payload.description).toBe('First idea draft')
    expect(payload.createdAt).toBeTruthy()
    expect(payload.updatedAt).toBeTruthy()

    const storedIdea = await prisma.idea.findUnique({
      where: { id: payload.id }
    })

    const storedLatestVersion = await prisma.ideaVersion.findFirst({
      where: { ideaId: payload.id },
      orderBy: { versionNumber: 'desc' },
      select: {
        title: true,
        description: true
      }
    })

    expect(storedIdea).not.toBeNull()
    expect(storedIdea?.userId).toBe(user.id)
    expect(storedLatestVersion?.title).toBe('MVP discovery board')
    expect(storedLatestVersion?.description).toBe('First idea draft')
  })

  it('normalizes blank descriptions to null before persistence', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-create-null-description',
      name: 'Ideas Create Null Description'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await postIdea(user.cookieHeader, {
      title: 'Idea without description',
      description: '   '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaResponseDto
    expect(payload.description).toBeNull()

    const storedLatestVersion = await prisma.ideaVersion.findFirst({
      where: { ideaId: payload.id },
      orderBy: { versionNumber: 'desc' },
      select: { description: true }
    })

    expect(storedLatestVersion?.description).toBeNull()
  })

  it('rejects invalid payloads with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-create-invalid-body',
      name: 'Ideas Create Invalid Body'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await postIdea(user.cookieHeader, {
      title: '   '
    })

    expect(response.status).toBe(400)
  })

  it('enforces free-plan idea limit and blocks a second idea with 403', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-create-free-limit',
      name: 'Ideas Create Free Limit'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const firstResponse = await postIdea(user.cookieHeader, {
      title: 'First idea'
    })
    expect(firstResponse.status).toBe(200)

    const secondResponse = await postIdea(user.cookieHeader, {
      title: 'Second idea'
    })

    expect(secondResponse.status).toBe(403)

    const count = await prisma.idea.count({
      where: { userId: user.id }
    })

    expect(count).toBe(1)
  })
})
