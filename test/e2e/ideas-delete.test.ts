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
import { createIdeaForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('DELETE /api/ideas/:id integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteIdeaWithCookie = async (
    cookieHeader: string,
    ideaId: string
  ): Promise<Response> => {
    return fetch(url(`/api/ideas/${ideaId}`), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication for idea deletion', async () => {
    const response = await fetch(url(`/api/ideas/${randomUUID()}`), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes an idea owned by the authenticated user and returns 204', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-delete-owner',
      name: 'Ideas Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Delete me'
    })

    const response = await deleteIdeaWithCookie(user.cookieHeader, idea.id)

    expect(response.status).toBe(204)

    const deletedIdea = await prisma.idea.findUnique({
      where: { id: idea.id }
    })

    expect(deletedIdea).toBeNull()
  })

  it('returns 404 and keeps data unchanged when deleting another users idea', async () => {
    const ownerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-delete-owner-b',
      name: 'Ideas Delete Owner B'
    })
    const attackerResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-delete-attacker',
      name: 'Ideas Delete Attacker'
    })

    const owner = expectAuthenticatedSessionCreated(ownerResult)
    const attacker = expectAuthenticatedSessionCreated(attackerResult)

    const ownersIdea = await createIdeaForUser({
      userId: owner.id,
      title: 'Owners protected idea'
    })

    const response = await deleteIdeaWithCookie(attacker.cookieHeader, ownersIdea.id)

    expect(response.status).toBe(404)

    const stillExisting = await prisma.idea.findUnique({
      where: { id: ownersIdea.id }
    })

    expect(stillExisting).not.toBeNull()
    expect(stillExisting?.userId).toBe(owner.id)
  })

  it('returns 404 when idea does not exist for the authenticated user', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-delete-missing',
      name: 'Ideas Delete Missing'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteIdeaWithCookie(user.cookieHeader, randomUUID())

    expect(response.status).toBe(404)
  })

  it('rejects invalid idea ids with 400', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'ideas-delete-invalid-id',
      name: 'Ideas Delete Invalid Id'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const response = await deleteIdeaWithCookie(user.cookieHeader, 'not-a-uuid')

    expect(response.status).toBe(400)
  })
})
