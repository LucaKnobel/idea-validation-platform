import * as z from 'zod'
import { useI18n } from '#imports'

export const useValidation = () => {
  const { t } = useI18n()

  const createRegisterFormSchema = () => z.object({
    email: z.string({ error: t('validation.email.required') })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: t('validation.email.invalid') })),
    password: z.string({ error: t('validation.password.required') })
      .min(15, { error: t('validation.password.min') })
      .max(256, { error: t('validation.password.max') })
      .regex(/[A-Z]/, { error: t('validation.password.uppercase') })
      .regex(/[a-z]/, { error: t('validation.password.lowercase') })
      .regex(/[0-9]/, { error: t('validation.password.number') })
      .regex(/[^A-Za-z0-9]/, { error: t('validation.password.special') }),
    passwordConfirm: z.string({ error: t('validation.password.required') })
  }).refine(data => data.password === data.passwordConfirm, {
    error: t('validation.password.confirmMismatch'),
    path: ['passwordConfirm']
  })

  const createLoginFormSchema = () => z.object({
    email: z.string({ error: t('validation.email.required') })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: t('validation.email.invalid') })),
    password: z.string({ error: t('validation.password.required') })
      .max(256, { error: t('validation.password.max') })
  })

  const createVerifyEmailSchema = () => z.object({
    email: z.string({ error: t('validation.email.required') })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: t('validation.email.invalid') }))
  })

  return {
    createRegisterFormSchema,
    createLoginFormSchema,
    createVerifyEmailSchema
  }
}

export type RegisterForm = z.infer<ReturnType<ReturnType<typeof useValidation>['createRegisterFormSchema']>>
export type LoginForm = z.infer<ReturnType<ReturnType<typeof useValidation>['createLoginFormSchema']>>
export type VerifyEmailForm = z.infer<ReturnType<ReturnType<typeof useValidation>['createVerifyEmailSchema']>>
