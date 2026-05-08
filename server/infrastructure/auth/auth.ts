import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@infrastructure/db/prisma'
import { InvalidAuthRequestBodyError, UnsupportedAuthRequestBodyError, validateAuthRequestBody } from '@infrastructure/auth/auth-body-validator'
import { sendVerificationMail } from '@infrastructure/mail/send-verification-mail'
import { resolveLocaleFromRequest } from '@infrastructure/http/locale-resolver'
import { logger } from '@infrastructure/logging/logger'

const createInvalidRequestBodyError = () => new APIError('BAD_REQUEST', {
  message: 'Invalid request body',
  code: 'INVALID_REQUEST_BODY'
})

const createUnsupportedRequestBodyError = () => new APIError('BAD_REQUEST', {
  message: 'Unsupported auth request body',
  code: 'UNSUPPORTED_AUTH_REQUEST_BODY'
})

/* Better-Auth configuration */
export const auth = betterAuth({

  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    minPasswordLength: 15,
    maxPasswordLength: 256
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: false,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url }, request) => {
      const locale = resolveLocaleFromRequest(request)
      void sendVerificationMail({
        to: user.email,
        verifyUrl: url,
        locale
      }).then(() => {
        logger.info('Verification email queued', {
          userId: user.id,
          locale
        })
      }).catch((error: unknown) => {
        logger.error('Failed to send verification email', {
          userId: user.id,
          locale
        }, error)
      })
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      try {
        const validatedBody = validateAuthRequestBody(ctx.path, ctx.body)

        if (!validatedBody) {
          return
        }

        return {
          context: {
            ...ctx,
            body: validatedBody
          }
        }
      } catch (error: unknown) {
        if (error instanceof UnsupportedAuthRequestBodyError) {
          logger.warn('Auth request body without schema', {
            path: ctx.path
          })
          throw createUnsupportedRequestBodyError()
        }

        if (error instanceof InvalidAuthRequestBodyError) {
          logger.warn('Invalid auth payload', {
            path: ctx.path,
            issues: error.issues
          })
          throw createInvalidRequestBodyError()
        }

        throw error
      }
    })
  }
})
