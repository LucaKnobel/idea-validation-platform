import * as z from 'zod'

export type RegisterForm = {
  email: string
  password: string
  passwordConfirm: string
}

export type LoginForm = {
  email: string
  password: string
}

export type VerifyEmailForm = {
  email: string
}

export type PasswordForm = {
  password: string
  passwordConfirm: string
}

export const useValidation = () => {
  const { t } = useI18n()

  const createEmailFieldSchema = () => z.string({ error: t('validation.email.required') })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: t('validation.email.invalid') }))

  const createStrongPasswordFieldSchema = () => z.string({ error: t('validation.password.required') })
    .min(15, { error: t('validation.password.min') })
    .max(256, { error: t('validation.password.max') })
    .regex(/[A-Z]/, { error: t('validation.password.uppercase') })
    .regex(/[a-z]/, { error: t('validation.password.lowercase') })
    .regex(/[0-9]/, { error: t('validation.password.number') })
    .regex(/[^A-Za-z0-9]/, { error: t('validation.password.special') })

  const createRegisterFormSchema = () => z.object({
    email: createEmailFieldSchema(),
    password: createStrongPasswordFieldSchema(),
    passwordConfirm: z.string({ error: t('validation.password.required') })
  }).refine(data => data.password === data.passwordConfirm, {
    error: t('validation.password.confirmMismatch'),
    path: ['passwordConfirm']
  })

  const createLoginFormSchema = () => z.object({
    email: createEmailFieldSchema(),
    password: z.string({ error: t('validation.password.required') })
      .max(256, { error: t('validation.password.max') })
  })

  const createVerifyEmailSchema = () => z.object({
    email: createEmailFieldSchema()
  })

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
