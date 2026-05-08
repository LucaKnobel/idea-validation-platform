import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@infrastructure/db/prisma'
import { RegisterUserBodySchema } from '@infrastructure/auth/auth-schemas'
import { sendVerificationMail } from '@infrastructure/mail/send-verification-mail'
import { resolveMailLocaleFromRequest } from '@infrastructure/http/locale-resolver'
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
      const locale = resolveMailLocaleFromRequest(request)
      void sendVerificationMail({
        to: user.email,
        verifyUrl: url,
        locale
      }).catch((error: unknown) => {
        logger.error('Failed to send verification email', { email: user.email }, error)
      })
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== '/sign-up/email') {
        return
      }

      RegisterUserBodySchema.parse(ctx.body)
    })
  }
})
