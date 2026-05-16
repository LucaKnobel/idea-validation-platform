import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  getE2ESetupOptions,
  clearAuthTables,
  expectAuthFailure,
  password,
  postRegister
} from './auth-test-helpers'

beforeEach(clearAuthTables)

describe('Auth registration flow', async () => {
  await setup(getE2ESetupOptions())

  it('accepts a valid sign-up request and returns HTTP 200', async () => {
    const email = `register-flow-${randomUUID()}@example.com`

    const response = await postRegister({
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    })

    expect(response.status).toBe(200)
  })

  it('creates an unverified user profile after sign-up', async () => {
    const email = `register-flow-${randomUUID()}@example.com`

    const response = await postRegister({
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    })

    expect(response.status).toBe(200)

    const storedUser = await prisma.user.findUnique({
      where: { email }
    })

    expect(storedUser).not.toBeNull()
    expect(storedUser?.email).toBe(email)
    expect(storedUser?.name).toBe('Register Flow Test User')
    expect(storedUser?.emailVerified).toBe(false)
  })

  it('stores a non-plain-text password hash in the account record', async () => {
    const email = `register-flow-${randomUUID()}@example.com`

    const response = await postRegister({
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    })

    expect(response.status).toBe(200)

    const storedUser = await prisma.user.findUnique({
      where: { email }
    })

    expect(storedUser).not.toBeNull()

    const storedAccount = await prisma.account.findFirst({
      where: {
        userId: storedUser?.id
      }
    })

    expect(storedAccount).not.toBeNull()
    expect(storedAccount?.password).toBeTruthy()
    expect(storedAccount?.password).not.toBe(password)
    expect((storedAccount?.password ?? '').length).toBeGreaterThan(20)
  })

  it('rejects absolute callback URLs during registration and persists no user', async () => {
    const email = `invalid-callback-${randomUUID()}@example.com`

    const response = await postRegister({
      email,
      password,
      name: 'Invalid Callback URL Test User',
      callbackURL: 'https://example.com/auth/login'
    })

    await expectAuthFailure(response, 400, 'INVALID_REQUEST_BODY')

    const storedUser = await prisma.user.findUnique({
      where: { email }
    })

    expect(storedUser).toBeNull()
  })

  it('rejects weak sign-up passwords and does not persist a user', async () => {
    const email = `weak-password-${randomUUID()}@example.com`

    const response = await postRegister({
      email,
      password: 'weak',
      name: 'Weak Password Test User',
      callbackURL: '/auth/login'
    })

    await expectAuthFailure(response, 400, 'INVALID_REQUEST_BODY')

    const storedUser = await prisma.user.findUnique({
      where: { email }
    })

    expect(storedUser).toBeNull()
  })

  it('normalizes email input before persistence', async () => {
    const rawEmail = `  Register.Flow+Case-${randomUUID()}@Example.COM  `
    const normalizedEmail = rawEmail.trim().toLowerCase()

    const response = await postRegister({
      email: rawEmail,
      password,
      name: 'Email Normalization Test User',
      callbackURL: '/auth/login'
    })

    expect(response.status).toBe(200)

    const storedUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    })

    expect(storedUser).not.toBeNull()
    expect(storedUser?.email).toBe(normalizedEmail)
  })

  it('prevents duplicate registrations from creating extra user or account records', async () => {
    const email = `register-flow-${randomUUID()}@example.com`

    const firstResponse = await postRegister({
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    })

    const duplicateResponse = await postRegister({
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    })

    expect(firstResponse.status).toBe(200)
    expect(duplicateResponse.status).toBe(200)

    const usersWithEmail = await prisma.user.count({
      where: { email }
    })

    const storedUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    const accountCount = await prisma.account.count({
      where: {
        userId: storedUser?.id
      }
    })

    expect(usersWithEmail).toBe(1)
    expect(accountCount).toBe(1)
  })

  it('rate limits repeated sign-up requests from the same client IP', async () => {
    const clientIp = '203.0.113.174'

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await postRegister({
        email: `rl-signup-${attempt}-${randomUUID()}@example.com`,
        password: 'weak',
        name: 'Rate Limit Signup Test User',
        callbackURL: '/auth/login'
      }, { clientIp })

      await expectAuthFailure(response, 400, 'INVALID_REQUEST_BODY')
    }

    const limitedResponse = await postRegister({
      email: `rl-signup-limited-${randomUUID()}@example.com`,
      password: 'weak',
      name: 'Rate Limit Signup Test User',
      callbackURL: '/auth/login'
    }, { clientIp })

    const limitedBody = await expectAuthFailure(limitedResponse, 429)
    expect((limitedBody.message ?? '').toLowerCase()).toContain('too many requests')
  })
})
