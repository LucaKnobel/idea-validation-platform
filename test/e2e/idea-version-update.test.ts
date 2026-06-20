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
import { createIdeaVersionForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('PUT /api/ideas/:id/versions/:versionId integration', async () => {
  await setup(getE2ESetupOptions())

  const updateIdeaVersionWithCookie = async (
    cookieHeader: string,
    ideaId: string,
    versionId: string,
    body: Record<string, unknown>
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}/versions/${versionId}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json',
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(body)
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}/versions/${randomUUID()}`), {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({ title: 'Updated title' })
    })

    expect(response.status).toBe(401)
  })

  it('updates title and description for owner and persists changes', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-version-update-owner',
      name: 'Idea Version Update Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Original title',
      description: 'Original description'
    })

    const response = await updateIdeaVersionWithCookie(user.cookieHeader, version.ideaId, version.ideaVersionId, {
      title: 'Updated title',
      description: 'Updated description'
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionMetadataDto

    expect(payload.id).toBe(version.ideaVersionId)
    expect(payload.title).toBe('Updated title')
    expect(payload.description).toBe('Updated description')

    const persisted = await prisma.ideaVersion.findUniqueOrThrow({
      where: {
        id: version.ideaVersionId
      }
    })

    expect(persisted.title).toBe('Updated title')
    expect(persisted.description).toBe('Updated description')
  })

  it('normalizes empty description to null', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-version-update-empty-description',
      name: 'Idea Version Update Empty Description'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const version = await createIdeaVersionForUser({
      userId: user.id,
      title: 'Original title',
      description: 'Original description'
    })

    const response = await updateIdeaVersionWithCookie(user.cookieHeader, version.ideaId, version.ideaVersionId, {
      title: 'Updated title',
      description: '   '
    })

    expect(response.status).toBe(200)

    const payload = await response.json() as IdeaVersionMetadataDto

    expect(payload.description).toBeNull()

    const persisted = await prisma.ideaVersion.findUniqueOrThrow({
      where: { id: version.ideaVersionId }
    })

    expect(persisted.description).toBeNull()
  })

  it('returns 404 for foreign idea version access', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-version-update-owner-foreign',
      name: 'Idea Version Update Owner Foreign'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'idea-version-update-attacker',
      name: 'Idea Version Update Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const version = await createIdeaVersionForUser({
      userId: owner.id,
      title: 'Private title',
      description: 'Private description'
    })

    const response = await updateIdeaVersionWithCookie(attacker.cookieHeader, version.ideaId, version.ideaVersionId, {
      title: 'Should fail',
      description: 'Should fail'
    })

    expect(response.status).toBe(404)
  })

  it('rejects invalid route params and invalid body with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'idea-version-update-invalid',
      name: 'Idea Version Update Invalid'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const invalidRouteResponse = await updateIdeaVersionWithCookie(user.cookieHeader, 'not-a-uuid', 'still-not-a-uuid', {
      title: 'Updated title'
    })

    expect(invalidRouteResponse.status).toBe(400)

    const invalidBodyResponse = await updateIdeaVersionWithCookie(user.cookieHeader, randomUUID(), randomUUID(), {
      title: '   '
    })

    expect(invalidBodyResponse.status).toBe(400)
  })
})
