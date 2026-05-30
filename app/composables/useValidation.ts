import * as z from 'zod'
import { CANVAS_SECTION_ORDER } from '~/types/canvasSections'

/**
 * Creates localized Zod schemas used by frontend forms (auth, idea creation, and canvas).
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

  /**
   * Builds the schema for idea creation in the dashboard modal.
   */
  const createIdeaFormSchema = () => z.object({
    title: z.string()
      .trim()
      .min(1, t('createIdeaModal.validation.titleRequired'))
      .max(200, t('createIdeaModal.validation.titleTooLong')),
    description: z.string()
      .trim()
      .max(3000, t('createIdeaModal.validation.descriptionTooLong'))
      .optional()
      .or(z.literal(''))
  })

  /**
   * Builds the schema for one canvas element entry.
   */
  const createCanvasElementSchema = () => z.object({
    type: z.enum(CANVAS_SECTION_ORDER),
    content: z.string({ error: t('validation.canvas.contentRequired') })
      .trim()
      .min(1, t('validation.canvas.contentRequired'))
      .max(500, t('validation.canvas.contentTooLong'))
  })

  /**
   * Builds the schema for replacing a full canvas snapshot.
   */
  const createReplaceCanvasSchema = () => z.object({
    elements: z.array(createCanvasElementSchema())
      .max(500, t('validation.canvas.tooManyElements'))
  })

  return {
    createPasswordSchema,
    createRegisterFormSchema,
    createLoginFormSchema,
    createVerifyEmailSchema,
    createIdeaFormSchema,
    createCanvasElementSchema,
    createReplaceCanvasSchema
  }
}
