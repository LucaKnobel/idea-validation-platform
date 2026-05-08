import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@infrastructure/db/prisma'
import { RegisterUserBodySchema } from '@infrastructure/auth/auth-schemas'
import { sendVerificationMail } from '@infrastructure/mail/send-verification-mail'
import { resolveLocaleFromRequest } from '@infrastructure/http/locale-resolver'
import { logger } from '@infrastructure/logging/logger'

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
      if (ctx.path !== '/sign-up/email') {
        return
      }

      const parsedBody = RegisterUserBodySchema.safeParse(ctx.body)

      if (!parsedBody.success) {
        logger.warn('Invalid sign-up payload', {
          path: ctx.path
        })

        throw new APIError('BAD_REQUEST', {
          message: 'Invalid request body',
          code: 'INVALID_REQUEST_BODY'
        })
      }
    })
  }
})
