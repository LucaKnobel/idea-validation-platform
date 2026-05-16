import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  getE2ESetupOptions,
  clearAuthTables,
  expectAuthFailure,
  expectNoSessionCookie,
  expectNoSensitiveSessionFields,
  expectSecureSessionCookie,
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
  await setup(getE2ESetupOptions())

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

    await expectAuthFailure(response, 401, 'INVALID_EMAIL_OR_PASSWORD')
    expectNoSessionCookie(response)
  })

  it('rejects login for an unknown user and does not set a session cookie', async () => {
    const response = await postSignIn({
      email: `unknown-user-${randomUUID()}@example.com`,
      password,
      rememberMe: true
    })

    await expectAuthFailure(response, 401, 'INVALID_EMAIL_OR_PASSWORD')
    expectNoSessionCookie(response)
  })

  it('rejects login for an unverified user and does not create a session', async () => {
    const { email } = await createRegisteredUser(false)

    const response = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    await expectAuthFailure(response, 403, 'EMAIL_NOT_VERIFIED')
    expectNoSessionCookie(response)

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    const sessions = await prisma.session.count({
      where: { userId: user?.id }
    })

    expect(sessions).toBe(0)
  })

  it('returns the same auth error payload for unknown user and wrong password to reduce account enumeration', async () => {
    const { email } = await createRegisteredUser(true)

    const wrongPasswordResponse = await postSignIn({
      email,
      password: 'WrongPassword1!',
      rememberMe: true
    })

    const unknownUserResponse = await postSignIn({
      email: `unknown-user-${randomUUID()}@example.com`,
      password,
      rememberMe: true
    })

    const wrongPasswordBody = await expectAuthFailure(wrongPasswordResponse, 401, 'INVALID_EMAIL_OR_PASSWORD')
    const unknownUserBody = await expectAuthFailure(unknownUserResponse, 401, 'INVALID_EMAIL_OR_PASSWORD')
    expect(unknownUserBody.message).toBe(wrongPasswordBody.message)
  })

  it('returns the same login failure response shape even with missing or untrusted origin headers', async () => {
    const missingOriginResponse = await postSignIn({
      email: `unknown-user-${randomUUID()}@example.com`,
      password,
      rememberMe: true
    }, {
      includeOriginHeaders: false,
      clientIp: '203.0.113.171'
    })

    const badOriginResponse = await postSignIn({
      email: `unknown-user-${randomUUID()}@example.com`,
      password,
      rememberMe: true
    }, {
      origin: 'http://evil.example',
      referer: 'http://evil.example/',
      clientIp: '203.0.113.172'
    })

    const missingOriginBody = await expectAuthFailure(missingOriginResponse, 401, 'INVALID_EMAIL_OR_PASSWORD')
    const badOriginBody = await expectAuthFailure(badOriginResponse, 401, 'INVALID_EMAIL_OR_PASSWORD')

    expectNoSessionCookie(missingOriginResponse)
    expectNoSessionCookie(badOriginResponse)
    expect(badOriginBody.message).toBe(missingOriginBody.message)
  })

  it('rate limits repeated failed login attempts from the same client IP', async () => {
    const { email } = await createRegisteredUser(true)
    const clientIp = '203.0.113.173'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await postSignIn({
        email,
        password: 'WrongPassword1!',
        rememberMe: true
      }, { clientIp })

      await expectAuthFailure(response, 401, 'INVALID_EMAIL_OR_PASSWORD')
      expectNoSessionCookie(response)
    }

    const limitedResponse = await postSignIn({
      email,
      password: 'WrongPassword1!',
      rememberMe: true
    }, { clientIp })

    const limitedBody = await expectAuthFailure(limitedResponse, 429)
    expectNoSessionCookie(limitedResponse)
    expect((limitedBody.message ?? '').toLowerCase()).toContain('too many requests')
  })

  it('issues a new session cookie value on repeated successful logins', async () => {
    const { email } = await createRegisteredUser(true)

    const firstLogin = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect(firstLogin.status).toBe(200)
    const firstSetCookie = firstLogin.headers.get('set-cookie')
    expect(firstSetCookie).toBeTruthy()
    expectSecureSessionCookie(firstSetCookie ?? '')

    const secondLogin = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect(secondLogin.status).toBe(200)
    const secondSetCookie = secondLogin.headers.get('set-cookie')
    expect(secondSetCookie).toBeTruthy()
    expectSecureSessionCookie(secondSetCookie ?? '')

    const firstCookie = firstSetCookie ? extractCookieHeader(firstSetCookie) : null
    const secondCookie = secondSetCookie ? extractCookieHeader(secondSetCookie) : null

    expect(firstCookie).toBeTruthy()
    expect(secondCookie).toBeTruthy()
    expect(secondCookie).not.toBe(firstCookie)
  })

  it('creates a hardened session cookie and persists a session record on successful login', async () => {
    const { email } = await createRegisteredUser(true)

    const signInResponse = await postSignIn({
      email,
      password,
      rememberMe: true
    })

    expect(signInResponse.status).toBe(200)

    const setCookie = signInResponse.headers.get('set-cookie')
    expect(setCookie).toBeTruthy()
    expectSecureSessionCookie(setCookie ?? '')

    const cookieHeader = setCookie ? extractCookieHeader(setCookie) : null
    expect(cookieHeader).toBeTruthy()

    const sessionResponse = await getSession(cookieHeader ?? '')

    expect(sessionResponse.status).toBe(200)
    const sessionPayload = await sessionResponse.json() as unknown
    expectNoSensitiveSessionFields(sessionPayload)

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
