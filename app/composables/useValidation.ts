import * as z from 'zod'
import { CANVAS_SECTION_ORDER } from '~/types/canvasSections'

const HYPOTHESIS_DIMENSIONS = [
  'PROBLEM',
  'SOLUTION',
  'MARKET',
  'MONETIZATION',
  'EXECUTION'
] as const satisfies readonly UpsertHypothesisBodyDto['dimension'][]

const HYPOTHESIS_PRIORITIES = [
  'HIGH',
  'MEDIUM',
  'LOW'
] as const satisfies readonly UpsertHypothesisBodyDto['priority'][]

const HYPOTHESIS_EVIDENCE_TYPES = [
  'QUALITATIVE',
  'QUANTITATIVE',
  'BEHAVIORAL',
  'MONETARY'
] as const satisfies readonly UpsertHypothesisBodyDto['evidenceType'][]

const METRIC_THRESHOLD_OPERATORS = [
  'GTE',
  'GT',
  'LTE',
  'LT',
  'EQ'
] as const satisfies readonly UpsertMetricBodyDto['threshold']['operator'][]

const EXPERIMENT_STATUSES = [
  'PLANNED',
  'RUNNING',
  'COMPLETED',
  'CANCELLED'
] as const satisfies readonly UpsertExperimentBodyDto['status'][]

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
   * Builds the authenticated password change schema, including current-password input.
   */
  const createChangePasswordSchema = () => z.object({
    currentPassword: z.string({ error: t('validation.password.required') })
      .min(1, { error: t('validation.password.required') })
      .max(256, { error: t('validation.password.max') }),
    newPassword: createStrongPasswordFieldSchema(),
    passwordConfirm: z.string({ error: t('validation.password.required') })
  }).refine(data => data.newPassword === data.passwordConfirm, {
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
   * Builds the schema for updating idea metadata in workspace overview.
   * Shares constraints with the create-idea flow.
   */
  const createIdeaMetadataFormSchema = () => createIdeaFormSchema()

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

  /**
   * Builds the schema for creating and updating hypotheses.
   */
  const createHypothesisFormSchema = () => z.object({
    statement: z.string({ error: t('validation.hypothesis.statementRequired') })
      .trim()
      .min(1, t('validation.hypothesis.statementRequired'))
      .max(3000, t('validation.hypothesis.statementTooLong')),
    dimension: z.enum(HYPOTHESIS_DIMENSIONS, { error: t('validation.hypothesis.dimensionRequired') }),
    priority: z.enum(HYPOTHESIS_PRIORITIES, { error: t('validation.hypothesis.priorityRequired') }),
    evidenceType: z.enum(HYPOTHESIS_EVIDENCE_TYPES, { error: t('validation.hypothesis.evidenceTypeRequired') }),
    canvasElementTypes: z.array(z.enum(CANVAS_SECTION_ORDER))
      .min(1, t('validation.hypothesis.canvasSectionMin'))
      .max(9, t('validation.hypothesis.canvasSectionMax'))
  })

  /**
   * Builds the schema for creating and updating metrics in one modal.
   */
  const createMetricFormSchema = () => z.object({
    name: z.string({ error: t('validation.metric.nameRequired') })
      .trim()
      .min(1, t('validation.metric.nameRequired'))
      .max(200, t('validation.metric.nameTooLong')),
    description: z.string()
      .trim()
      .max(1000, t('validation.metric.descriptionTooLong'))
      .optional()
      .or(z.literal('')),
    unit: z.string()
      .trim()
      .max(100, t('validation.metric.unitTooLong'))
      .optional()
      .or(z.literal('')),
    threshold: z.object({
      operator: z.enum(METRIC_THRESHOLD_OPERATORS, { error: t('validation.metric.operatorRequired') }),
      referenceValue: z.coerce.number({ error: t('validation.metric.referenceValueRequired') })
    })
  })

  /**
   * Builds the schema for creating and updating experiments in one modal.
   */
  const createExperimentFormSchema = () => z.object({
    title: z.string({ error: t('validation.experiment.titleRequired') })
      .trim()
      .min(1, t('validation.experiment.titleRequired'))
      .max(200, t('validation.experiment.titleTooLong')),
    description: z.string()
      .trim()
      .max(4000, t('validation.experiment.descriptionTooLong'))
      .optional()
      .or(z.literal('')),
    status: z.enum(EXPERIMENT_STATUSES, { error: t('validation.experiment.statusRequired') })
  })

  /**
   * Builds the schema for creating and updating measurements in one modal.
   */
  const createMeasurementFormSchema = () => z.object({
    value: z.coerce.number({ error: t('validation.measurement.valueRequired') }),
    note: z.string()
      .trim()
      .max(2000, t('validation.measurement.noteTooLong'))
      .optional()
      .or(z.literal(''))
  })

  return {
    createChangePasswordSchema,
    createPasswordSchema,
    createRegisterFormSchema,
    createLoginFormSchema,
    createVerifyEmailSchema,
    createIdeaFormSchema,
    createIdeaMetadataFormSchema,
    createCanvasElementSchema,
    createReplaceCanvasSchema,
    createHypothesisFormSchema,
    createMetricFormSchema,
    createExperimentFormSchema,
    createMeasurementFormSchema
  }
}
