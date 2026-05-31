import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'

import {
  clearAuthTables,
  createAuthenticatedSession,
  expectAuthenticatedSessionCreated,
  getApiWithCookie,
  getE2ESetupOptions,
  getSession,
  postSignOut
} from './auth-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('Auth logout flow', async () => {
  await setup(getE2ESetupOptions())

  it('logs out an authenticated user', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'logout-flow',
      name: 'Logout Flow Test User'
    })
    const { cookieHeader } = expectAuthenticatedSessionCreated(sessionResult)

    const logoutResponse = await postSignOut(cookieHeader)

    expect(logoutResponse.status).toBe(200)
  })

  it('invalidates the active session after logout', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'logout-flow',
      name: 'Logout Flow Test User'
    })
    const { cookieHeader } = expectAuthenticatedSessionCreated(sessionResult)

    const sessionBeforeLogout = await getSession(cookieHeader)
    expect(sessionBeforeLogout.status).toBe(200)

    const beforePayload = await sessionBeforeLogout.json() as { session?: unknown, user?: unknown }
    expect(beforePayload.session).toBeTruthy()
    expect(beforePayload.user).toBeTruthy()

    const logoutResponse = await postSignOut(cookieHeader)
    expect(logoutResponse.status).toBe(200)

    const sessionAfterLogout = await getSession(cookieHeader)
    expect(sessionAfterLogout.status).toBe(200)

    const afterPayload = await sessionAfterLogout.json() as { session?: unknown, user?: unknown } | null

    if (afterPayload === null) {
      expect(afterPayload).toBeNull()
      return
    }

    expect(afterPayload.session ?? null).toBeNull()
    expect(afterPayload.user ?? null).toBeNull()
  })

  it('blocks access to a protected route after logout', async () => {
    const sessionResult = await createAuthenticatedSession({
      emailPrefix: 'logout-flow',
      name: 'Logout Flow Test User'
    })
    const { cookieHeader } = expectAuthenticatedSessionCreated(sessionResult)

    const beforeLogoutResponse = await getApiWithCookie('/api/protected-probe', cookieHeader)
    expect(beforeLogoutResponse.status).toBe(404)

    const logoutResponse = await postSignOut(cookieHeader)
    expect(logoutResponse.status).toBe(200)

    const afterLogoutResponse = await getApiWithCookie('/api/protected-probe', cookieHeader)
    expect(afterLogoutResponse.status).toBe(401)
  })
})
