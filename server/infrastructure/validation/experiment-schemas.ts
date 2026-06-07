import * as z from 'zod'
import { experimentStatuses } from '@application/models/experiment'
import { HypothesisRouteParamsSchema } from '@infrastructure/validation/hypothesis-schemas'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

export const ExperimentCollectionRouteParamsSchema = HypothesisRouteParamsSchema

export const ExperimentRouteParamsSchema = ExperimentCollectionRouteParamsSchema.extend({
  experimentId: z.uuid()
})

export const ExperimentStatusSchema = z.enum(experimentStatuses)

export const UpsertExperimentBodySchema = z.object({
  title: z.string().trim().min(1, 'Experiment title is required').max(200, 'Experiment title is too long'),
  description: createNullableTrimmedStringSchema(4000, 'Experiment description is too long'),
  status: ExperimentStatusSchema
})

export const CreateExperimentBodySchema = UpsertExperimentBodySchema

export const UpdateExperimentBodySchema = UpsertExperimentBodySchema

export const ExperimentResponseSchema = z.object({
  id: z.uuid(),
  hypothesisId: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
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
