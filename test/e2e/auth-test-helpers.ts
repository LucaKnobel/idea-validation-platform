import { randomInt } from 'node:crypto'

import { url } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'

type AuthE2ESetupOptions
  = | { host: string }
    | { rootDir: string, setupTimeout: number, teardownTimeout: number }

export const createAuthE2ESetupOptions = (): AuthE2ESetupOptions => {
  return process.env.NUXT_TEST_HOST
    ? { host: process.env.NUXT_TEST_HOST }
    : { rootDir: '.', setupTimeout: 240000, teardownTimeout: 30000 }
}

export const password = 'VeryStrongPassword1!'

export type RegisterPayload = {
  email: string
  password: string
  name: string
  callbackURL: string
}

export type SignInPayload = {
  email: string
  password: string
  rememberMe?: boolean
}

export const createClientIp = (): string => `203.0.113.${randomInt(10, 240)}`

const createRequestOrigin = (): string => new URL(url('/')).origin

const createApiUrl = (path: string): string => new URL(path, `${createRequestOrigin()}/`).toString()

const createAuthHeaders = (): Record<string, string> => ({
  'origin': createRequestOrigin(),
  'referer': `${createRequestOrigin()}/`,
  'content-type': 'application/json',
  'x-forwarded-for': createClientIp()
})

export const postRegister = (payload: RegisterPayload) => {
  return fetch(createApiUrl('/api/auth/sign-up/email'), {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify(payload)
  })
}

export const postSignIn = (payload: SignInPayload) => {
  return fetch(createApiUrl('/api/auth/sign-in/email'), {
    method: 'POST',
    headers: createAuthHeaders(),
    body: JSON.stringify(payload)
  })
}

export const getSession = (cookieHeader: string) => {
  return fetch(createApiUrl('/api/auth/get-session'), {
    method: 'GET',
    headers: {
      'origin': createRequestOrigin(),
      'referer': `${createRequestOrigin()}/`,
      'cookie': cookieHeader,
      'x-forwarded-for': createClientIp()
    }
  })
}

export const extractCookieHeader = (setCookie: string): string | null => {
  const match = setCookie.match(/([^=;\s]+=[^;,.\s]+)/)
  return match?.[1] ?? null
}

export const clearAuthTables = async () => {
  await prisma.rateLimit.deleteMany({})
  await prisma.verification.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
}
