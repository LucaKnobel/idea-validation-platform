import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { useRuntimeConfig } from '#imports'
import { prisma } from '@infrastructure/db/prisma'
import { InvalidAuthRequestBodyError, UnsupportedAuthRequestBodyError, validateAuthRequestBody } from '@infrastructure/auth/auth-body-validator'
import { sendVerificationMail } from '@infrastructure/mail/send-verification-mail'
import { sendResetPasswordMail } from '@infrastructure/mail/send-reset-password-mail'
import { resolveLocaleFromRequest } from '@infrastructure/http/locale-resolver'
import { logger } from '@infrastructure/logging/logger'

//  Helpers

type BetterAuthLevel = 'debug' | 'info' | 'warn' | 'error'

/** Maps Pino log levels to BetterAuth-compatible levels. `trace` => `debug` since BetterAuth doesn't support trace. */
const toBetterAuthLogLevel = (value: unknown): BetterAuthLevel => {
  if (value === 'trace' || value === 'debug') return 'debug'
  if (value === 'info') return 'info'
  if (value === 'error') return 'error'
  return 'warn'
}

const authEventByPath = {
  '/sign-up/email': { event: 'auth.sign_up', action: 'sign up' },
  '/sign-in/email': { event: 'auth.sign_in', action: 'sign in' },
  '/sign-out': { event: 'auth.sign_out', action: 'sign out' },
  '/send-verification-email': { event: 'auth.send_verification_email', action: 'send verification email' },
  '/verify-email': { event: 'auth.verify_email', action: 'verify email' },
  '/request-password-reset': { event: 'auth.request_password_reset', action: 'request password reset' },
  '/reset-password': { event: 'auth.reset_password', action: 'reset password' }
} as const

// Request body error factories

const invalidRequestBodyError = () => new APIError('BAD_REQUEST', {
  message: 'Invalid request body',
  code: 'INVALID_REQUEST_BODY'
})

const unsupportedRequestBodyError = () => new APIError('BAD_REQUEST', {
  message: 'Unsupported auth request body',
  code: 'UNSUPPORTED_AUTH_REQUEST_BODY'
})

const isRateLimitError = (error: APIError): boolean => {
  const status = (error as { status?: number }).status
  if (status === 429) return true

  const code = (error as { body?: { code?: string } }).body?.code
  if (code === 'TOO_MANY_REQUESTS') return true

  return false
}

// Better-Auth Configuration

const { logLevel } = useRuntimeConfig()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  advanced: {
    ipAddress: {
      // Managed NGINX forwards the client IP via these headers.
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      // Rate-limit IPv6 by /64 to reduce bypass via address rotation.
      ipv6Subnet: 64
    }
  },

  rateLimit: {
    storage: 'database',
    modelName: 'rateLimit',
    enabled: true,
    // Default: 50 requests per 10 seconds for all auth endpoints
    window: 10,
    max: 50,
    customRules: {
      // Credential-based sign-in: very strict to slow brute-force
      '/sign-in/email': { window: 60, max: 5 },
      // Registration: tight to prevent account spam
      '/sign-up/email': { window: 60, max: 5 },
      // Password reset request: strict to prevent email flooding
      '/request-password-reset': { window: 300, max: 3 },
      // Password reset confirmation: strict, link is single-use anyway
      '/reset-password': { window: 300, max: 5 },
      // Verification email resend: prevent mail bombing
      '/send-verification-email': { window: 300, max: 3 },
      // Email verification click: lenient, user may retry from link
      '/verify-email': { window: 60, max: 10 },
      // Session check: read-only, high frequency expected
      '/get-session': false
    }
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 15,
    maxPasswordLength: 256,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      const locale = resolveLocaleFromRequest(request)
      void sendResetPasswordMail({ to: user.email, resetUrl: url, locale })
        .then(() => {
          logger.info('Password reset email sent', { userId: user.id, locale })
        })
        .catch((error: unknown) => {
          logger.error('Failed to send password reset email', { userId: user.id, locale }, error)
        })
    },
    onPasswordReset: async ({ user }, _request) => {
      logger.info('Password reset completed', { userId: user.id })
    }
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = resolveLocaleFromRequest(request)
      void sendVerificationMail({ to: user.email, verifyUrl: url, locale })
        .then(() => {
          logger.info('Verification email sent', { userId: user.id, locale })
        })
        .catch((error: unknown) => {
          logger.error('Failed to send verification email', { userId: user.id, locale }, error)
        })
    }
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      try {
        const validatedBody = validateAuthRequestBody(ctx.path, ctx.body)
        if (!validatedBody) return
        return { context: { ...ctx, body: validatedBody } }
      } catch (error: unknown) {
        if (error instanceof UnsupportedAuthRequestBodyError) {
          logger.warn('Auth request body without schema', { path: ctx.path })
          throw unsupportedRequestBodyError()
        }
        if (error instanceof InvalidAuthRequestBodyError) {
          logger.warn('Invalid auth payload', { path: ctx.path, issues: error.issues })
          throw invalidRequestBodyError()
        }
        throw error
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      const entry = authEventByPath[ctx.path as keyof typeof authEventByPath]
      if (!entry) return

      const { event, action } = entry
      // ctx.context.returned is either a successful Response or an APIError
      const returned = (ctx.context as { returned?: unknown }).returned
      const failure = returned instanceof APIError
      const userId = (ctx.context as { newSession?: { user?: { id?: string } } }).newSession?.user?.id

      if (failure) {
        if (isRateLimitError(returned)) {
          logger.warn('Auth request rate limited', {
            source: 'auth-event',
            event: 'auth.rate_limit',
            path: ctx.path
          })
          return
        }

        logger.warn(`Auth ${action} failed`, { source: 'auth-event', event, path: ctx.path })
        return
      }

      logger.info(`Auth ${action} succeeded`, {
        source: 'auth-event',
        event,
        path: ctx.path,
        ...(userId ? { userId } : {})
      })
    })
  },

  // Maps BetterAuth's internal framework logs to our pino app logger.
  // These are low-level framework messages, not business events.
  logger: {
    disabled: false,
    level: toBetterAuthLogLevel(logLevel),
    log: (level, message, ...args) => {
      if (level === 'error' && (message === 'Invalid password' || message === 'Invalid request body')) {
        return
      }

      const meta = { source: 'better-auth' }
      const errorArg = args.find(arg => arg instanceof Error)

      if (level === 'debug') logger.debug(message, meta)
      else if (level === 'info') logger.info(message, meta)
      else if (level === 'warn') logger.warn(message, meta)
      else logger.error(message, meta, errorArg)
    }
  }
})
