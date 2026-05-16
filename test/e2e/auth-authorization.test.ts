import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  getE2ESetupOptions,
  getPageWithCookie,
  getSession,
  password,
  postRegister,
  postSignIn
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

const createAuthenticatedSession = async (prefix: string) => {
  const email = `${prefix}-${randomUUID()}@example.com`

  const signUpResponse = await postRegister({
    email,
    password,
    name: `${prefix} User`,
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

describe('Authorization flow', async () => {
  await setup(getE2ESetupOptions())

  it('redirects unauthenticated users from /en/dashboard to login', async () => {
    const response = await getPageWithCookie('/en/dashboard', '')

    expect(response.status).toBe(302)
    const location = response.headers.get('location') ?? ''
    expect(location).toContain('/auth/login')
  })

  it('allows authenticated users to access /en/dashboard', async () => {
    const { cookieHeader } = await createAuthenticatedSession('authz-dashboard')

    const response = await getPageWithCookie('/en/dashboard', cookieHeader)

    expect(response.status).toBe(200)
  })

  it('prevents user A from accessing user B session resource', async () => {
    const userA = await createAuthenticatedSession('authz-user-a')
    const userB = await createAuthenticatedSession('authz-user-b')

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
