import * as z from 'zod'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

export const MeasurementRouteParamsSchema = z.object({
  id: z.uuid()
})

export const UpsertMeasurementBodySchema = z.object({
  metricId: z.uuid(),
  value: z.number(),
  note: createNullableTrimmedStringSchema(2000, 'Measurement note is too long')
})

export const CreateMeasurementBodySchema = UpsertMeasurementBodySchema

export const UpdateMeasurementBodySchema = UpsertMeasurementBodySchema

export const MeasurementResponseSchema = z.object({
  id: z.uuid(),
  experimentId: z.uuid(),
  metricId: z.uuid(),
  value: z.number(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export type MeasurementRouteParamsDto = z.infer<typeof MeasurementRouteParamsSchema>
export type CreateMeasurementBodyDto = z.infer<typeof CreateMeasurementBodySchema>
export type UpdateMeasurementBodyDto = z.infer<typeof UpdateMeasurementBodySchema>
export type MeasurementResponseDto = z.infer<typeof MeasurementResponseSchema>
