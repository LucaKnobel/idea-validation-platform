import { randomInt, randomUUID } from 'node:crypto'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { fetch, setup } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'

await setup({
  rootDir: process.cwd(),
  server: true,
  browser: false
})

describe('Backend registration flow', () => {
  const password = 'VeryStrongPassword1!'
  type RegisterPayload = {
    email: string
    password: string
    name: string
    callbackURL: string
  }

  const createPayload = (): RegisterPayload => {
    const email = `register-flow-${randomUUID()}@example.com`
    return {
      email,
      password,
      name: 'Register Flow Test User',
      callbackURL: '/auth/login'
    }
  }

  const createClientIp = (): string => `203.0.113.${randomInt(10, 240)}`

  const postRegister = (payload: RegisterPayload) => {
    return fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': createClientIp()
      },
      body: JSON.stringify(payload)
    })
  }

  beforeEach(async () => {
    // Keep state isolated across tests.
    await prisma.user.deleteMany({})
    await prisma.verification.deleteMany({})
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('accepts a valid sign-up request and returns HTTP 200', async () => {
    const payload = createPayload()
    const response = await postRegister(payload)

    expect(response.status).toBe(200)
  })

  it('creates an unverified user profile after sign-up', async () => {
    const payload = createPayload()
    const response = await postRegister(payload)
    expect(response.status).toBe(200)

    const storedUser = await prisma.user.findUnique({
      where: {
        email: payload.email
      }
    })

    expect(storedUser).not.toBeNull()
    expect(storedUser?.email).toBe(payload.email)
    expect(storedUser?.name).toBe('Register Flow Test User')
    expect(storedUser?.emailVerified).toBe(false)
  })

  it('stores a non-plain-text password hash in the account record', async () => {
    const payload = createPayload()
    const response = await postRegister(payload)
    expect(response.status).toBe(200)

    const storedUser = await prisma.user.findUnique({
      where: {
        email: payload.email
      }
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

    expect([400, 422]).toContain(response.status)

    const storedUser = await prisma.user.findUnique({
      where: {
        email
      }
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

    expect([400, 422]).toContain(response.status)

    const storedUser = await prisma.user.findUnique({
      where: {
        email
      }
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
    const payload = createPayload()
    const firstResponse = await postRegister(payload)
    const duplicateResponse = await postRegister(payload)

    expect(firstResponse.status).toBe(200)
    expect([200, 400]).toContain(duplicateResponse.status)

    const usersWithEmail = await prisma.user.count({
      where: {
        email: payload.email
      }
    })

    const storedUser = await prisma.user.findUnique({
      where: {
        email: payload.email
      },
      select: {
        id: true
      }
    })

    const accountCount = await prisma.account.count({
      where: {
        userId: storedUser?.id
      }
    })

    expect(usersWithEmail).toBe(1)
    expect(accountCount).toBe(1)
  })
})
