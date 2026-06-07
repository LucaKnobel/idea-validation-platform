import * as z from 'zod'
import { experimentStatuses } from '@application/models/experiment'
import { HypothesisRouteParamsSchema } from '@infrastructure/validation/hypothesis-schemas'

const EXPERIMENT_TEMPLATE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const NullableExperimentStringSchema = (maxLength: number, tooLongMessage: string) => z.string()
  .trim()
  .max(maxLength, tooLongMessage)
  .nullable()
  .transform(value => value && value.length > 0 ? value : null)

export const ExperimentCollectionRouteParamsSchema = HypothesisRouteParamsSchema

export const ExperimentRouteParamsSchema = ExperimentCollectionRouteParamsSchema.extend({
  experimentId: z.uuid()
})

export const ExperimentStatusSchema = z.enum(experimentStatuses)

const ExperimentTemplateIdValueSchema = z.string()
  .trim()
  .max(120, 'Experiment template id is too long')
  .regex(EXPERIMENT_TEMPLATE_ID_PATTERN, 'Experiment template id must be a kebab-case slug')

export const ExperimentTemplateIdSchema = z.union([
  ExperimentTemplateIdValueSchema,
  z.null(),
  z.literal('')
]).transform((value) => {
  if (value === null || value === '') {
    return null
  }

  return value
})

export const UpsertExperimentBodySchema = z.object({
  title: z.string().trim().min(1, 'Experiment title is required').max(200, 'Experiment title is too long'),
  description: NullableExperimentStringSchema(4000, 'Experiment description is too long'),
  templateId: ExperimentTemplateIdSchema,
  status: ExperimentStatusSchema
})

export const CreateExperimentBodySchema = UpsertExperimentBodySchema

export const UpdateExperimentBodySchema = UpsertExperimentBodySchema

export const ExperimentResponseSchema = z.object({
  id: z.uuid(),
  hypothesisId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  templateId: z.string().nullable(),
  status: ExperimentStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export const ExperimentsListResponseSchema = z.object({
  items: z.array(ExperimentResponseSchema)
})

export type ExperimentCollectionRouteParamsDto = z.infer<typeof ExperimentCollectionRouteParamsSchema>
export type ExperimentRouteParamsDto = z.infer<typeof ExperimentRouteParamsSchema>
export type CreateExperimentBodyDto = z.infer<typeof CreateExperimentBodySchema>
export type UpdateExperimentBodyDto = z.infer<typeof UpdateExperimentBodySchema>
export type ExperimentResponseDto = z.infer<typeof ExperimentResponseSchema>
export type ExperimentsListResponseDto = z.infer<typeof ExperimentsListResponseSchema>
