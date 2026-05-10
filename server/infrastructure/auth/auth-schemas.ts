import * as z from 'zod'

const EmailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'))

const PasswordSchema = z.string()
  .min(15, 'Password must be at least 15 characters')
  .max(256, 'Password must not exceed 256 characters')

const StrongPasswordSchema = PasswordSchema
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

const CallbackURLSchema = z.string()
  .trim()
  .min(1, 'Callback URL must not be empty')
  .max(2048, 'Callback URL must not exceed 2048 characters')
  .regex(/^\/(?!\/)/, 'Callback URL must be a relative path starting with /')

const RedirectToSchema = z.string()
  .trim()
  .min(1, 'Redirect URL must not be empty')
  .max(2048, 'Redirect URL must not exceed 2048 characters')
  .pipe(z.url({
    protocol: /^https?$/,
    error: 'Redirect URL must be a valid URL'
  }))

export const LoginUserBodySchema = z.object({
  email: EmailSchema,
  // At login, we only verify the password field is present and non-empty.
  // Password policy (min length, complexity) is enforced at registration only.
  password: z.string().min(1, 'Password is required').max(256, 'Password must not exceed 256 characters'),
  rememberMe: z.boolean().optional(),
  callbackURL: CallbackURLSchema.optional()
})

export const RegisterUserBodySchema = z.object({
  email: EmailSchema,
  password: StrongPasswordSchema,
  callbackURL: CallbackURLSchema.optional()
})

export const SendVerificationEmailBodySchema = z.object({
  email: EmailSchema,
  callbackURL: CallbackURLSchema.optional()
})

export const RequestPasswordResetBodySchema = z.object({
  email: EmailSchema,
  redirectTo: RedirectToSchema.optional()
})

export const ResetPasswordBodySchema = z.object({
  newPassword: StrongPasswordSchema,
  token: z.string()
    .trim()
    .min(1, 'Token is required')
    .max(512, 'Token must not exceed 512 characters')
})

export type LoginUserBodyDto = z.infer<typeof LoginUserBodySchema>
export type RegisterUserBodyDto = z.infer<typeof RegisterUserBodySchema>
export type SendVerificationEmailBodyDto = z.infer<typeof SendVerificationEmailBodySchema>
export type RequestPasswordResetBodyDto = z.infer<typeof RequestPasswordResetBodySchema>
export type ResetPasswordBodyDto = z.infer<typeof ResetPasswordBodySchema>
