import type { Measurement } from '@application/models/measurement'
import {
  MeasurementResponseSchema,
  MeasurementsListResponseSchema,
  type MeasurementResponseDto,
  type MeasurementsListResponseDto
} from '@infrastructure/validation/measurement-schemas'

/**
 * Maps one domain measurement to the public API response DTO.
 */
export const toMeasurementResponseDto = (measurement: Measurement): MeasurementResponseDto => {
  return MeasurementResponseSchema.parse({
    id: measurement.id,
    experimentId: measurement.experimentId,
    metricId: measurement.metricId,
    value: measurement.value,
    note: measurement.note,
    createdAt: measurement.createdAt.toISOString(),
    updatedAt: measurement.updatedAt.toISOString()
  })
}

/**
 * Maps a list of domain measurements to the public collection DTO.
 */
export const toMeasurementsListResponseDto = (measurements: Measurement[]): MeasurementsListResponseDto => {
  return MeasurementsListResponseSchema.parse({
    items: measurements.map(toMeasurementResponseDto)
  })
}
