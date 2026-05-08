import * as z from 'zod'

const EmailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'))

const PasswordSchema = z.string()
  .min(15, 'Password must be at least 15 characters')
  .max(256, 'Password must not exceed 256 characters')

const CallbackURLSchema = z.string()
  .trim()
  .min(1, 'Callback URL must not be empty')
  .max(2048, 'Callback URL must not exceed 2048 characters')
  .regex(/^\/(?!\/)/, 'Callback URL must be a relative path starting with /')

export const LoginUserBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  rememberMe: z.boolean().optional(),
  callbackURL: CallbackURLSchema.optional()
})

export const RegisterUserBodySchema = z.object({
  email: EmailSchema,
  password: PasswordSchema
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  callbackURL: CallbackURLSchema.optional()
})

export const SendVerificationEmailBodySchema = z.object({
  email: EmailSchema,
  callbackURL: CallbackURLSchema.optional()
})

export type LoginUserBodyDto = z.infer<typeof LoginUserBodySchema>
export type RegisterUserBodyDto = z.infer<typeof RegisterUserBodySchema>
export type SendVerificationEmailBodyDto = z.infer<typeof SendVerificationEmailBodySchema>
