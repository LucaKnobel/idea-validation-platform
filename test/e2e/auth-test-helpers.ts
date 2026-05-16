import { randomInt } from 'node:crypto'

import { url } from '@nuxt/test-utils/e2e'
import { expect } from 'vitest'

import { prisma } from '@infrastructure/db/prisma'

type AuthE2ESetupOptions
  = | { host: string }
    | { rootDir: string, setupTimeout: number, teardownTimeout: number }

/**
 * Uses shared host mode when global setup already started Nitro.
 * Falls back to local Nuxt setup for standalone file execution.
 */
export const getE2ESetupOptions = (): AuthE2ESetupOptions => {
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

export type RequestPasswordResetPayload = {
  email: string
  redirectTo?: string
}

export type ResetPasswordPayload = {
  newPassword: string
  token: string
}

export type AuthRequestOptions = {
  clientIp?: string
  origin?: string
  referer?: string
  includeOriginHeaders?: boolean
}

type AuthErrorResponse = {
  message?: string
  code?: string
}

const internalErrorLeakPattern = /prisma|sql|stack|trace|referenceerror|typeerror|syntaxerror/i
const sensitiveSessionKeyPattern = /password|hash|token|secret|api[_-]?key|credential|providersecret/i

export const createClientIp = (): string => `203.0.113.${randomInt(10, 240)}`

const createRequestOrigin = (): string => new URL(url('/')).origin
const isSecureOrigin = (): boolean => createRequestOrigin().startsWith('https://')

const createApiUrl = (path: string): string => new URL(path, `${createRequestOrigin()}/`).toString()

const createAuthHeaders = (options?: AuthRequestOptions): Record<string, string> => {
  const origin = options?.origin ?? createRequestOrigin()
  const includeOriginHeaders = options?.includeOriginHeaders ?? true

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-forwarded-for': options?.clientIp ?? createClientIp()
  }

  if (includeOriginHeaders) {
    headers.origin = origin
    headers.referer = options?.referer ?? `${origin}/`
  }

  return headers
}

export const postRegister = (payload: RegisterPayload, options?: AuthRequestOptions) => {
  return fetch(createApiUrl('/api/auth/sign-up/email'), {
    method: 'POST',
    headers: createAuthHeaders(options),
    body: JSON.stringify(payload)
  })
}

export const postSignIn = (payload: SignInPayload, options?: AuthRequestOptions) => {
  return fetch(createApiUrl('/api/auth/sign-in/email'), {
    method: 'POST',
    headers: createAuthHeaders(options),
    body: JSON.stringify(payload)
  })
}

export const postRequestPasswordReset = (payload: RequestPasswordResetPayload, options?: AuthRequestOptions) => {
  const origin = options?.origin ?? createRequestOrigin()
  const redirectTo = payload.redirectTo
    ? new URL(payload.redirectTo, origin).toString()
    : undefined

  return fetch(createApiUrl('/api/auth/request-password-reset'), {
    method: 'POST',
    headers: createAuthHeaders(options),
    body: JSON.stringify({
      email: payload.email,
      ...(redirectTo ? { redirectTo } : {})
    })
  })
}

export const postResetPassword = (payload: ResetPasswordPayload, options?: AuthRequestOptions) => {
  return fetch(createApiUrl('/api/auth/reset-password'), {
    method: 'POST',
    headers: createAuthHeaders(options),
    body: JSON.stringify(payload)
  })
}

export const postSignOut = (cookieHeader: string, options?: AuthRequestOptions) => {
  const headers: Record<string, string> = {
    ...createAuthHeaders(options),
    cookie: cookieHeader
  }

  return fetch(createApiUrl('/api/auth/sign-out'), {
    method: 'POST',
    headers,
    body: JSON.stringify({})
  })
}

export const getPageWithCookie = (path: string, cookieHeader: string, options?: AuthRequestOptions) => {
  const origin = options?.origin ?? createRequestOrigin()
  const headers: Record<string, string> = {
    'cookie': cookieHeader,
    'x-forwarded-for': options?.clientIp ?? createClientIp(),
    'accept': 'text/html'
  }

  return fetch(new URL(path, `${origin}/`).toString(), {
    method: 'GET',
    headers,
    redirect: 'manual'
  })
}

export const getApiWithCookie = (path: string, cookieHeader: string, options?: AuthRequestOptions) => {
  const origin = options?.origin ?? createRequestOrigin()
  const includeOriginHeaders = options?.includeOriginHeaders ?? true

  const headers: Record<string, string> = {
    'cookie': cookieHeader,
    'x-forwarded-for': options?.clientIp ?? createClientIp()
  }

  if (includeOriginHeaders) {
    headers.origin = origin
    headers.referer = options?.referer ?? `${origin}/`
  }

  return fetch(new URL(path, `${origin}/`).toString(), {
    method: 'GET',
    headers,
    redirect: 'manual'
  })
}

export const getSession = (cookieHeader: string, options?: AuthRequestOptions) => {
  const origin = options?.origin ?? createRequestOrigin()
  const includeOriginHeaders = options?.includeOriginHeaders ?? true

  const headers: Record<string, string> = {
    'cookie': cookieHeader,
    'x-forwarded-for': options?.clientIp ?? createClientIp()
  }

  if (includeOriginHeaders) {
    headers.origin = origin
    headers.referer = options?.referer ?? `${origin}/`
  }

  return fetch(createApiUrl('/api/auth/get-session'), {
    method: 'GET',
    headers
  })
}

export const extractCookieHeader = (setCookie: string): string | null => {
  const match = setCookie.match(/([^=;\s]+=[^;,.\s]+)/)
  return match?.[1] ?? null
}

/**
 * Parses auth error payloads and enforces non-disclosure of internal details.
 */
export const parseSafeAuthErrorResponse = async (response: Response): Promise<AuthErrorResponse> => {
  const body = await response.json() as AuthErrorResponse

  expect(body.message).toBeTypeOf('string')
  expect(body.message ?? '').not.toMatch(internalErrorLeakPattern)

  return body
}

export const expectAuthFailure = async (
  response: Response,
  expectedStatus: number,
  expectedCode?: string
) => {
  expect(response.status).toBe(expectedStatus)
  const body = await parseSafeAuthErrorResponse(response)
  if (expectedCode) {
    expect(body.code).toBe(expectedCode)
  }
  return body
}

export const expectNoSessionCookie = (response: Response): void => {
  expect(response.headers.get('set-cookie')).toBeNull()
}

export const expectSecureSessionCookie = (setCookie: string): void => {
  const normalized = setCookie.toLowerCase()
  expect(normalized).toContain('httponly')
  expect(normalized).toContain('samesite')
  expect(normalized).toContain('path=/')
  if (isSecureOrigin()) {
    expect(normalized).toContain('secure')
  }
}

const assertNoSensitiveKeysRecursive = (value: unknown): void => {
  if (!value || typeof value !== 'object') {
    return
  }

  if (Array.isArray(value)) {
    value.forEach(assertNoSensitiveKeysRecursive)
    return
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    expect(key.toLowerCase()).not.toMatch(sensitiveSessionKeyPattern)
    assertNoSensitiveKeysRecursive(nestedValue)
  })
}

export const expectNoSensitiveSessionFields = (sessionPayload: unknown): void => {
  assertNoSensitiveKeysRecursive(sessionPayload)
}

export const clearAuthTables = async () => {
  await prisma.rateLimit.deleteMany({})
  await prisma.verification.deleteMany({})
  await prisma.session.deleteMany({})
  await prisma.account.deleteMany({})
  await prisma.user.deleteMany({})
}
