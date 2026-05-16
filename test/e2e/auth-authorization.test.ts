import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'

import {
  clearAuthTables,
  createAuthenticatedSession,
  getE2ESetupOptions,
  getPageWithCookie,
  getSession
} from './auth-test-helpers'

beforeEach(clearAuthTables)

describe('Authorization flow', async () => {
  await setup(getE2ESetupOptions())

  it('redirects unauthenticated users from /en/dashboard to login', async () => {
    const response = await getPageWithCookie('/en/dashboard', '')

    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('/auth/login')
  })

  it('allows authenticated users to access /en/dashboard', async () => {
    const { cookieHeader } = await createAuthenticatedSession({
      emailPrefix: 'authz-dashboard',
      name: 'AuthZ Dashboard User'
    })

    const response = await getPageWithCookie('/en/dashboard', cookieHeader)

    expect(response.status).toBe(200)
  })

  it('prevents user A from accessing user B session resource', async () => {
    const userA = await createAuthenticatedSession({
      emailPrefix: 'authz-user-a',
      name: 'AuthZ User A'
    })
    const userB = await createAuthenticatedSession({
      emailPrefix: 'authz-user-b',
      name: 'AuthZ User B'
    })

    const userASessionResponse = await getSession(userA.cookieHeader)
    const userBSessionResponse = await getSession(userB.cookieHeader)

    expect(userASessionResponse.status).toBe(200)
    expect(userBSessionResponse.status).toBe(200)

    const userASession = await userASessionResponse.json() as {
      user?: { email?: string }
    } | null

    const userBSession = await userBSessionResponse.json() as {
      user?: { email?: string }
    } | null

    expect(userASession?.user?.email).toBe(userA.email)
    expect(userASession?.user?.email).not.toBe(userB.email)

    expect(userBSession?.user?.email).toBe(userB.email)
    expect(userBSession?.user?.email).not.toBe(userA.email)
  })
})
