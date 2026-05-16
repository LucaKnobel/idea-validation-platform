import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  InvalidAuthRequestBodyError,
  UnsupportedAuthRequestBodyError
} from '@infrastructure/auth/auth-body-validator'

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
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
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

vi.mock('#imports', () => ({
  useRuntimeConfig: () => ({
    logLevel: 'info'
  })
}))

vi.mock('@infrastructure/auth/auth-body-validator', async () => {
  const { UnsupportedAuthRequestBodyError, InvalidAuthRequestBodyError } = await import('@infrastructure/auth/auth-body-validator')
  return {
    UnsupportedAuthRequestBodyError,
    InvalidAuthRequestBodyError,
    validateAuthRequestBody: testState.validateAuthRequestBody
  }
})

vi.mock('@infrastructure/mail/send-verification-mail', () => ({
  sendVerificationMail: vi.fn(() => Promise.resolve())
}))

vi.mock('@infrastructure/mail/send-reset-password-mail', () => ({
  sendResetPasswordMail: vi.fn(() => Promise.resolve())
}))

vi.mock('@infrastructure/http/locale-resolver', () => ({
  resolveLocaleFromRequest: vi.fn(() => 'en')
}))

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    info: testState.info,
    warn: testState.warn,
    error: testState.error
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

const getAfterHook = () => {
  const config = testState.config as {
    hooks?: {
      after?: (ctx: { path: string, context: unknown }) => Promise<unknown>
    }
  }

  return config.hooks?.after
}

const getLogger = () => {
  const config = testState.config as {
    logger?: {
      log?: (level: string, message: string, ...args: unknown[]) => void
    }
  }

  return config.logger
}

describe('auth before-hook body validation', () => {
  beforeAll(async () => {
    await import('@infrastructure/auth/auth')
  })

  beforeEach(() => {
    testState.info.mockClear()
    testState.warn.mockClear()
    testState.error.mockClear()
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

  it('logs sign-in as failure when returned is an APIError', async () => {
    const afterHook = getAfterHook()

    expect(afterHook).toBeTypeOf('function')
    await afterHook?.({
      path: '/sign-in/email',
      context: {
        returned: new testState.MockAPIError('UNAUTHORIZED', { message: 'Invalid password' })
      }
    })

    expect(testState.warn).toHaveBeenCalledWith(
      'Auth sign in failed',
      expect.objectContaining({
        source: 'auth-event',
        event: 'auth.sign_in',
        path: '/sign-in/email'
      })
    )
  })

  it('logs sign-in as success when session user id exists', async () => {
    const afterHook = getAfterHook()

    expect(afterHook).toBeTypeOf('function')
    await afterHook?.({
      path: '/sign-in/email',
      context: {
        newSession: {
          user: {
            id: 'user-123'
          }
        }
      }
    })

    expect(testState.info).toHaveBeenCalledWith(
      'Auth sign in succeeded',
      expect.objectContaining({
        source: 'auth-event',
        event: 'auth.sign_in',
        path: '/sign-in/email',
        userId: 'user-123'
      })
    )
  })

  it('logs sign-up as accepted to reflect neutral duplicate handling', async () => {
    const afterHook = getAfterHook()

    expect(afterHook).toBeTypeOf('function')
    await afterHook?.({
      path: '/sign-up/email',
      context: {}
    })

    expect(testState.info).toHaveBeenCalledWith(
      'Auth sign up accepted',
      expect.objectContaining({
        source: 'auth-event',
        event: 'auth.sign_up',
        path: '/sign-up/email'
      })
    )
  })

  it('redacts email addresses from Better Auth duplicate signup logs', () => {
    const authLogger = getLogger()

    expect(authLogger?.log).toBeTypeOf('function')
    authLogger?.log?.('info', 'Sign-up attempt for existing email: user@example.com')

    expect(testState.info).toHaveBeenCalledWith('Sign-up attempt for existing email', {
      source: 'better-auth'
    })
  })
})
