import * as z from 'zod'

/**
 * Form model for account registration.
 */
export type RegisterForm = {
  email: string
  password: string
  passwordConfirm: string
}

/**
 * Form model for email/password sign-in.
 */
export type LoginForm = {
  email: string
  password: string
}

/**
 * Form model for email-only verification and recovery flows.
 */
export type VerifyEmailForm = {
  email: string
}

/**
 * Form model for password creation and confirmation.
 */
export type PasswordForm = {
  password: string
  passwordConfirm: string
}

/**
 * Creates localized Zod schemas for the authentication forms used by the frontend.
 */
export const useValidation = () => {
  const { t } = useI18n()

  /**
   * Builds a normalized email schema with localized validation errors.
   */
  const createEmailFieldSchema = () => z.string({ error: t('validation.email.required') })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: t('validation.email.invalid') }))

  /**
   * Builds the shared strong-password policy used across auth forms.
   */
  const createStrongPasswordFieldSchema = () => z.string({ error: t('validation.password.required') })
    .min(15, { error: t('validation.password.min') })
    .max(256, { error: t('validation.password.max') })
    .regex(/[A-Z]/, { error: t('validation.password.uppercase') })
    .regex(/[a-z]/, { error: t('validation.password.lowercase') })
    .regex(/[0-9]/, { error: t('validation.password.number') })
    .regex(/[^A-Za-z0-9]/, { error: t('validation.password.special') })

  /**
   * Builds the registration schema, including password confirmation matching.
   */
  const createRegisterFormSchema = () => z.object({
    email: createEmailFieldSchema(),
    password: createStrongPasswordFieldSchema(),
    passwordConfirm: z.string({ error: t('validation.password.required') })
  }).refine(data => data.password === data.passwordConfirm, {
    error: t('validation.password.confirmMismatch'),
    path: ['passwordConfirm']
  })

  /**
   * Builds the login schema with minimal password rules suitable for sign-in.
   */
  const createLoginFormSchema = () => z.object({
    email: createEmailFieldSchema(),
    password: z.string({ error: t('validation.password.required') })
      .max(256, { error: t('validation.password.max') })
  })

  /**
   * Builds the schema for forms that only ask for an email address.
   */
  const createVerifyEmailSchema = () => z.object({
    email: createEmailFieldSchema()
  })

  /**
   * Builds the password reset schema, including confirmation matching.
   */
  const createPasswordSchema = () => z.object({
    password: createStrongPasswordFieldSchema(),
    passwordConfirm: z.string({ error: t('validation.password.required') })
  }).refine(data => data.password === data.passwordConfirm, {
    error: t('validation.password.confirmMismatch'),
    path: ['passwordConfirm']
  })

  return {
    createPasswordSchema,
    createRegisterFormSchema,
    createLoginFormSchema,
    createVerifyEmailSchema
  }
}
