import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup, url } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createAuthenticatedSession,
  createClientIp,
  expectAuthenticatedSessionCreated,
  getApiWithCookie,
  getE2ESetupOptions
} from './auth-test-helpers'
import { createIdeaForUser } from './ideas-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('DELETE /api/users/me integration', async () => {
  await setup(getE2ESetupOptions())

  const deleteAccountWithCookie = async (cookieHeader: string): Promise<Response> => {
    return fetch(url('/api/users/me'), {
      method: 'DELETE',
      headers: {
        'cookie': cookieHeader,
        'x-forwarded-for': createClientIp()
      }
    })
  }

  it('requires authentication', async () => {
    const response = await fetch(url('/api/users/me'), {
      method: 'DELETE'
    })

    expect(response.status).toBe(401)
  })

  it('deletes authenticated user account and owned data', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'account-delete-owner',
      name: 'Account Delete Owner'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const idea = await createIdeaForUser({
      userId: user.id,
      title: 'Delete with account'
    })

    const response = await deleteAccountWithCookie(user.cookieHeader)

    expect(response.status).toBe(204)

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    expect(deletedUser).toBeNull()

    const deletedIdea = await prisma.idea.findUnique({
      where: { id: idea.id }
    })
    expect(deletedIdea).toBeNull()
  })

  it('invalidates existing session after account deletion', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'account-delete-session',
      name: 'Account Delete Session'
    })
    const user = expectAuthenticatedSessionCreated(sessionResult)

    const deleteResponse = await deleteAccountWithCookie(user.cookieHeader)
    expect(deleteResponse.status).toBe(204)

    const protectedResponse = await getApiWithCookie('/api/protected-probe', user.cookieHeader)
    expect(protectedResponse.status).toBe(401)

    const signOutResponse = await fetch(url('/api/auth/sign-out'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'cookie': user.cookieHeader,
        'x-forwarded-for': createClientIp()
      },
      body: '{}'
    })

    expect(signOutResponse.status).toBe(200)
  })
})
