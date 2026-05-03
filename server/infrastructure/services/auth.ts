import { betterAuth } from 'better-auth'
import { createAuthMiddleware } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@infrastructure/services/prisma'
import { RegisterUserBodySchema } from '@infrastructure/services/auth-schemas'

export const auth = betterAuth({

  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 15,
    maxPasswordLength: 256
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
