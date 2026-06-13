export type CreateMeasurementInput = {
  experimentId: string
  body: CreateMeasurementBodyDto
}

export type GetMeasurementInput = {
  measurementId: string
}

export type UpdateMeasurementInput = {
  measurementId: string
  body: UpdateMeasurementBodyDto
}

export type DeleteMeasurementInput = {
  measurementId: string
}

/**
 * Public contract implemented by useMeasurementApi.
 */
export interface UseMeasurementApiComposable {
  createMeasurement: (input: CreateMeasurementInput) => Promise<MeasurementResponseDto>
  getMeasurement: (input: GetMeasurementInput) => Promise<MeasurementResponseDto>
  updateMeasurement: (input: UpdateMeasurementInput) => Promise<MeasurementResponseDto>
  deleteMeasurement: (input: DeleteMeasurementInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for experiment measurement resources.
 */
export const useMeasurementApi = (): UseMeasurementApiComposable => {
  const createMeasurement = async (input: CreateMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/experiments/${input.experimentId}/measurements`, {
      method: 'POST',
      body: input.body
    })
  }

  const getMeasurement = async (input: GetMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/measurements/${input.measurementId}`)
  }

  const updateMeasurement = async (input: UpdateMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/measurements/${input.measurementId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMeasurement = async (input: DeleteMeasurementInput): Promise<void> => {
    await $fetch(`/api/measurements/${input.measurementId}`, {
      method: 'DELETE'
    })
  }

  return {
    createMeasurement,
    getMeasurement,
    updateMeasurement,
    deleteMeasurement
  }
}
