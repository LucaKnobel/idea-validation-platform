import { randomUUID } from 'node:crypto'

import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'

import {
  createAuthE2ESetupOptions,
  clearAuthTables,
  extractCookieHeader,
  getSession,
  password,
  postRegister,
  postSignIn
} from './auth-test-helpers'

beforeEach(clearAuthTables)

const createRegisteredUser = async (verified: boolean) => {
  const email = `login-flow-${randomUUID()}@example.com`

  const signUpResponse = await postRegister({
    email,
    password,
    name: 'Login Flow Test User',
    callbackURL: '/auth/login'
  })

  expect(signUpResponse.status).toBe(200)

  if (verified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })
  }

  return { email }
}

describe('Auth login flow', async () => {
  await setup(createAuthE2ESetupOptions())

  it('logs in a verified user with valid credentials', async () => {
    const { email } = await createRegisteredUser(true)

    const response = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect(response.status).toBe(200)
  })

  it('rejects login with an invalid password and does not set a session cookie', async () => {
    const { email } = await createRegisteredUser(true)

    const response = await postSignIn({
      email,
      password: 'WrongPassword1!',
      rememberMe: true
    })

    expect([400, 401, 403]).toContain(response.status)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('rejects login for an unknown user and does not set a session cookie', async () => {
    const response = await postSignIn({
      email: `unknown-user-${randomUUID()}@example.com`,
      password,
      rememberMe: true
    })

    expect([400, 401, 403]).toContain(response.status)
    expect(response.headers.get('set-cookie')).toBeNull()
  })

  it('rejects login for an unverified user and does not create a session', async () => {
    const { email } = await createRegisteredUser(false)

    const response = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect([400, 401, 403]).toContain(response.status)
    expect(response.headers.get('set-cookie')).toBeNull()

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    const sessions = await prisma.session.count({
      where: { userId: user?.id }
    })

    expect(sessions).toBe(0)
  })

  it('creates an HTTP-only session cookie and persists a session record on successful login', async () => {
    const { email } = await createRegisteredUser(true)

    const signInResponse = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect(signInResponse.status).toBe(200)

    const setCookie = signInResponse.headers.get('set-cookie')
    expect(setCookie).toBeTruthy()
    expect(setCookie?.toLowerCase()).toContain('httponly')

    const cookieHeader = setCookie ? extractCookieHeader(setCookie) : null
    expect(cookieHeader).toBeTruthy()

    const sessionResponse = await getSession(cookieHeader ?? '')

    expect(sessionResponse.status).toBe(200)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    const sessions = await prisma.session.count({
      where: { userId: user?.id }
    })

    expect(sessions).toBeGreaterThan(0)
  })
})
