import * as z from 'zod'

/**
 * Shared email normalization and validation rules for auth endpoints.
 */
const EmailSchema = z.string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Invalid email address'))

/**
 * Shared password length constraints used across auth flows.
 */
const PasswordSchema = z.string()
  .min(15, 'Password must be at least 15 characters')
  .max(256, 'Password must not exceed 256 characters')

/**
 * Password policy enforced when users create or replace a password.
 */
const StrongPasswordSchema = PasswordSchema
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Restricts callback targets to application-local paths.
 */
const CallbackURLSchema = z.string()
  .trim()
  .min(1, 'Callback URL must not be empty')
  .max(2048, 'Callback URL must not exceed 2048 characters')
  .regex(/^\/(?!\/)/, 'Callback URL must be a relative path starting with /')

/**
 * Validates absolute redirect URLs used for password reset emails.
 */
const RedirectToSchema = z.string()
  .trim()
  .min(1, 'Redirect URL must not be empty')
  .max(2048, 'Redirect URL must not exceed 2048 characters')
  .pipe(z.url({
    protocol: /^https?$/,
    error: 'Redirect URL must be a valid URL'
  }))

/**
 * Request body schema for email/password sign-in.
 */
export const LoginUserBodySchema = z.object({
  email: EmailSchema,
  // At login, we only verify the password field is present and non-empty.
  // Password policy (min length, complexity) is enforced at registration only.
  password: z.string().min(1, 'Password is required').max(256, 'Password must not exceed 256 characters'),
  rememberMe: z.boolean().optional(),
  callbackURL: CallbackURLSchema.optional()
})

/**
 * Request body schema for account registration.
 */
export const RegisterUserBodySchema = z.object({
  email: EmailSchema,
  password: StrongPasswordSchema,
  callbackURL: CallbackURLSchema.optional()
})

/**
 * Request body schema for resending verification emails.
 */
export const SendVerificationEmailBodySchema = z.object({
  email: EmailSchema,
  callbackURL: CallbackURLSchema.optional()
})

/**
 * Request body schema for starting the password reset flow.
 */
export const RequestPasswordResetBodySchema = z.object({
  email: EmailSchema,
  redirectTo: RedirectToSchema.optional()
})

/**
 * Request body schema for completing a password reset.
 */
export const ResetPasswordBodySchema = z.object({
  newPassword: StrongPasswordSchema,
  token: z.string()
    .trim()
    .min(1, 'Token is required')
    .max(512, 'Token must not exceed 512 characters')
})

/**
 * Request body schema for changing the current user's password while authenticated.
 */
export const ChangePasswordBodySchema = z.object({
  currentPassword: PasswordSchema,
  newPassword: StrongPasswordSchema,
  revokeOtherSessions: z.boolean().optional()
})

/**
 * Parsed DTO for the sign-in request body.
 */
export type LoginUserBodyDto = z.infer<typeof LoginUserBodySchema>
/**
 * Parsed DTO for the sign-up request body.
 */
export type RegisterUserBodyDto = z.infer<typeof RegisterUserBodySchema>
/**
 * Parsed DTO for the verification email resend request body.
 */
export type SendVerificationEmailBodyDto = z.infer<typeof SendVerificationEmailBodySchema>
/**
 * Parsed DTO for the password reset request body.
 */
export type RequestPasswordResetBodyDto = z.infer<typeof RequestPasswordResetBodySchema>
/**
 * Parsed DTO for the password reset confirmation body.
 */
export type ResetPasswordBodyDto = z.infer<typeof ResetPasswordBodySchema>
/**
 * Parsed DTO for the authenticated password change body.
 */
export type ChangePasswordBodyDto = z.infer<typeof ChangePasswordBodySchema>
