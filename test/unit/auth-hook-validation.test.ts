import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvalidAuthRequestBodyError,
  UnsupportedAuthRequestBodyError
} from '../../server/infrastructure/auth/auth-body-validator'

const testState = vi.hoisted(() => {
  class MockAPIError extends Error {
    status: string
    code: string | undefined

    constructor(status: string, payload?: { message?: string, code?: string }) {
      super(payload?.message ?? status)
      this.name = 'APIError'
      this.status = status
      this.code = payload?.code
    }
  }

  return {
    config: null as unknown,
    warn: vi.fn(),
    validateAuthRequestBody: vi.fn(),
    MockAPIError
  }
})

vi.mock('better-auth', () => ({
  betterAuth: vi.fn((config: unknown) => {
    testState.config = config
    return config
  })
}))

vi.mock('better-auth/api', () => ({
  APIError: testState.MockAPIError,
  createAuthMiddleware: vi.fn((fn: unknown) => fn)
}))

vi.mock('better-auth/adapters/prisma', () => ({
  prismaAdapter: vi.fn(() => ({}))
}))

vi.mock('@infrastructure/db/prisma', () => ({
  prisma: {}
}))

vi.mock('@infrastructure/auth/auth-body-validator', () => ({
  UnsupportedAuthRequestBodyError,
  InvalidAuthRequestBodyError,
  validateAuthRequestBody: testState.validateAuthRequestBody
}))

vi.mock('@infrastructure/mail/send-verification-mail', () => ({
  sendVerificationMail: vi.fn(() => Promise.resolve())
}))

vi.mock('@infrastructure/http/locale-resolver', () => ({
  resolveLocaleFromRequest: vi.fn(() => 'en')
}))

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: testState.warn,
    error: vi.fn()
  }
}))

const getBeforeHook = () => {
  const config = testState.config as {
    hooks?: {
      before?: (ctx: { path: string, body?: unknown }) => Promise<unknown>
    }
  }

  return config.hooks?.before
}

describe('auth before-hook body validation', () => {
  beforeAll(async () => {
    await import('../../server/infrastructure/auth/auth')
  })

  beforeEach(() => {
    testState.warn.mockClear()
    testState.validateAuthRequestBody.mockReset()
  })

  it('delegates validation to validateAuthRequestBody', async () => {
    const beforeHook = getBeforeHook()
    testState.validateAuthRequestBody.mockReturnValue(undefined)

    expect(beforeHook).toBeTypeOf('function')
    await beforeHook?.({ path: '/sign-in/email' })

    expect(testState.validateAuthRequestBody).toHaveBeenCalledWith('/sign-in/email', undefined)
  })

  it('maps unsupported-path result to API error and warn log', async () => {
    const beforeHook = getBeforeHook()
    testState.validateAuthRequestBody.mockImplementation(() => {
      throw new UnsupportedAuthRequestBodyError()
    })

    await expect(beforeHook?.({ path: '/reset-password', body: { email: 'a@b.com' } })).rejects.toMatchObject({
      status: 'BAD_REQUEST',
      code: 'UNSUPPORTED_AUTH_REQUEST_BODY'
    })

    expect(testState.warn).toHaveBeenCalledWith('Auth request body without schema', {
      path: '/reset-password'
    })
  })

  it('maps invalid result to API error and includes validation issues in logs', async () => {
    const beforeHook = getBeforeHook()
    testState.validateAuthRequestBody.mockImplementation(() => {
      throw new InvalidAuthRequestBodyError([{ path: 'email', code: 'invalid_format' }])
    })

    await expect(beforeHook?.({
      path: '/sign-in/email',
      body: {
        email: 'not-an-email',
        password: 'short'
      }
    })).rejects.toMatchObject({
      status: 'BAD_REQUEST',
      code: 'INVALID_REQUEST_BODY'
    })

    expect(testState.warn).toHaveBeenCalledWith(
      'Invalid auth payload',
      expect.objectContaining({
        path: '/sign-in/email',
        issues: [{ path: 'email', code: 'invalid_format' }]
      })
    )
  })
})
