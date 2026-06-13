import * as z from 'zod'
import { createNullableTrimmedStringSchema } from '@infrastructure/validation/string-schemas'

export const UpsertMeasurementBodySchema = z.object({
  value: z.number(),
  note: createNullableTrimmedStringSchema(2000, 'Measurement note is too long')
})

export const MeasurementResponseSchema = z.object({
  id: z.uuid(),
  value: z.number(),
  note: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime()
})

export type UpsertMeasurementBodyDto = z.infer<typeof UpsertMeasurementBodySchema>
export type MeasurementResponseDto = z.infer<typeof MeasurementResponseSchema>
