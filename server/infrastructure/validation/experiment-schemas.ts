import * as z from 'zod'
import { experimentStatuses } from '@application/models/experiment'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

export const ExperimentStatusSchema = z.enum(experimentStatuses)

export const UpsertExperimentBodySchema = z.object({
  title: z.string().trim().min(1, 'Experiment title is required').max(200, 'Experiment title is too long'),
  description: createNullableTrimmedStringSchema(4000, 'Experiment description is too long'),
  status: ExperimentStatusSchema
})

export const ExperimentResponseSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: ExperimentStatusSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export type UpsertExperimentBodyDto = z.infer<typeof UpsertExperimentBodySchema>
export type ExperimentResponseDto = z.infer<typeof ExperimentResponseSchema>
