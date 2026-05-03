import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@infrastructure/services/prisma'
import { RegisterUserBodySchema } from '@infrastructure/services/auth-schemas'
import { resolveMailLocaleFromRequest, sendVerificationMail } from '@infrastructure/services/mail'
import { logger } from '@infrastructure/services/logger'

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
