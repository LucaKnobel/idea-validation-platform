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

export type CreateAuthUserOptions = {
  emailPrefix?: string
  name?: string
  verified?: boolean
}

export type RegisteredAuthUser = {
  id: string
  email: string
}

export type RegisteredAuthUserActionResult = {
  signUpResponse: Response
  user: RegisteredAuthUser | null
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

export type AuthenticatedSession = RegisteredAuthUser & {
  cookieHeader: string
}

export type AuthenticatedSessionActionResult = {
  user: RegisteredAuthUser | null
  signInResponse: Response | null
  setCookie: string | null
  cookieHeader: string | null
}

export type PasswordResetTokenActionResult = {
  response: Response
  token: string | null
  verification: {
    identifier: string
    value: string
    expiresAt: Date
  } | null
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

/**
 * Creates a user via sign-up and optionally marks the account as verified.
 * Returns raw action results without assertions.
 */
export const createRegisteredAuthUser = async (options?: CreateAuthUserOptions) => {
  const emailPrefix = options?.emailPrefix ?? 'auth-e2e-user'
  const name = options?.name ?? 'Auth E2E Test User'
  const verified = options?.verified ?? false
  const email = `${emailPrefix}-${randomInt(1_000_000, 9_999_999)}@example.com`

  const signUpResponse = await postRegister({
    email,
    password,
    name,
    callbackURL: '/auth/login'
  })

  if (verified) {
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true }
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true }
  })

  return {
    signUpResponse,
    user
  } satisfies RegisteredAuthUserActionResult
}

export const expectRegisteredAuthUserCreated = (
  result: RegisteredAuthUserActionResult
): RegisteredAuthUser => {
  expect(result.signUpResponse.status).toBe(200)
  expect(result.user).not.toBeNull()

  return result.user as RegisteredAuthUser
}

export const postSignIn = (payload: SignInPayload, options?: AuthRequestOptions) => {
  return fetch(createApiUrl('/api/auth/sign-in/email'), {
    method: 'POST',
    headers: createAuthHeaders(options),
    body: JSON.stringify(payload)
  })
}

/**
 * Extracts the auth session cookie from a Set-Cookie header.
 * Falls back to the first cookie segment when the named cookie is missing.
 */
export const extractAuthSessionCookieHeader = (setCookie: string): string | null => {
  const authCookieMatch = setCookie.match(/better-auth\.session_token=[^;,\s]+/)
  if (authCookieMatch?.[0]) {
    return authCookieMatch[0]
  }

  const firstCookie = setCookie.split(',')[0]?.split(';')[0]?.trim()
  return firstCookie || null
}

/**
 * Creates a verified user and returns a valid authenticated cookie session.
 * Returns raw action results without assertions.
 */
export const createAuthenticatedSession = async (options?: Omit<CreateAuthUserOptions, 'verified'>) => {
  const registrationResult = await createRegisteredAuthUser({
    emailPrefix: options?.emailPrefix,
    name: options?.name,
    verified: true
  })

  const user = registrationResult.user

  if (!user) {
    return {
      user: null,
      signInResponse: null,
      setCookie: null,
      cookieHeader: null
    } satisfies AuthenticatedSessionActionResult
  }

  const signInResponse = await postSignIn({
    email: user.email,
    password,
    rememberMe: true
  })

  const setCookie = signInResponse.headers.get('set-cookie')
  const cookieHeader = setCookie ? extractAuthSessionCookieHeader(setCookie) : null

  return {
    user,
    signInResponse,
    setCookie,
    cookieHeader
  } satisfies AuthenticatedSessionActionResult
}

export const expectAuthenticatedSessionCreated = (
  result: AuthenticatedSessionActionResult
): AuthenticatedSession => {
  expect(result.user).not.toBeNull()
  expect(result.signInResponse).not.toBeNull()
  expect(result.signInResponse?.status).toBe(200)
  expect(result.setCookie).toBeTruthy()
  expect(result.cookieHeader).toBeTruthy()

  return {
    id: result.user!.id,
    email: result.user!.email,
    cookieHeader: result.cookieHeader ?? ''
  }
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

/**
 * Requests a password reset and returns the generated token persisted in the verification table.
 * Returns raw action results without assertions.
 */
export const requestPasswordResetAndGetToken = async (email: string, userId: string, redirectTo = '/auth/reset-password') => {
  const response = await postRequestPasswordReset({ email, redirectTo })

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: {
        startsWith: 'reset-password:'
      },
      value: userId
    }
  })

  const token = verification?.identifier.slice('reset-password:'.length) ?? null

  return {
    response,
    token,
    verification
  } satisfies PasswordResetTokenActionResult
}

export const expectPasswordResetTokenCreated = (
  result: PasswordResetTokenActionResult
): { token: string, verification: NonNullable<PasswordResetTokenActionResult['verification']> } => {
  expect(result.response.status).toBe(200)
  expect(result.verification).not.toBeNull()
  expect(result.token).toBeTruthy()

  return {
    token: result.token ?? '',
    verification: result.verification as NonNullable<PasswordResetTokenActionResult['verification']>
  }
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
