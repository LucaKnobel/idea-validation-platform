import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  getApiWithCookie,
  getE2ESetupOptions,
  getSession,
  password,
  postRegister,
  postSignIn,
  postSignOut
} from './auth-test-helpers'

beforeEach(clearAuthTables)

const extractAuthCookieHeader = (setCookie: string): string | null => {
  const authCookieMatch = setCookie.match(/better-auth\.session_token=[^;,\s]+/)
  if (authCookieMatch?.[0]) {
    return authCookieMatch[0]
  }

  const firstCookie = setCookie.split(',')[0]?.split(';')[0]?.trim()
  return firstCookie || null
}

const createAuthenticatedSession = async () => {
  const email = `logout-flow-${randomUUID()}@example.com`

  const signUpResponse = await postRegister({
    email,
    password,
    name: 'Logout Flow Test User',
    callbackURL: '/auth/login'
  })

  expect(signUpResponse.status).toBe(200)

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true }
  })

  const signInResponse = await postSignIn({
    email,
    password,
    rememberMe: true
  })

  expect(signInResponse.status).toBe(200)

  const setCookie = signInResponse.headers.get('set-cookie')
  expect(setCookie).toBeTruthy()

  const cookieHeader = setCookie ? extractAuthCookieHeader(setCookie) : null
  expect(cookieHeader).toBeTruthy()

  return {
    email,
    cookieHeader: cookieHeader ?? ''
  }
}

describe('Auth logout flow', async () => {
  await setup(getE2ESetupOptions())

  it('logs out an authenticated user', async () => {
    const { cookieHeader } = await createAuthenticatedSession()

    const logoutResponse = await postSignOut(cookieHeader)

    expect(logoutResponse.status).toBe(200)
  })

  it('invalidates the active session after logout', async () => {
    const { cookieHeader } = await createAuthenticatedSession()

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
    const { cookieHeader } = await createAuthenticatedSession()

    const beforeLogoutResponse = await getApiWithCookie('/api/protected-probe', cookieHeader)
    expect(beforeLogoutResponse.status).toBe(404)

    const logoutResponse = await postSignOut(cookieHeader)
    expect(logoutResponse.status).toBe(200)

    const afterLogoutResponse = await getApiWithCookie('/api/protected-probe', cookieHeader)
    expect(afterLogoutResponse.status).toBe(401)
  })
})
