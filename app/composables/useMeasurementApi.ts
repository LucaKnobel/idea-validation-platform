export type GetMeasurementInput = {
  hypothesisId: string
}

export type UpsertMeasurementInput = {
  hypothesisId: string
  body: UpsertMeasurementBodyDto
}

export type DeleteMeasurementInput = {
  hypothesisId: string
}

/**
 * Public contract implemented by useMeasurementApi.
 */
export interface UseMeasurementApiComposable {
  getMeasurement: (input: GetMeasurementInput) => Promise<MeasurementResponseDto>
  upsertMeasurement: (input: UpsertMeasurementInput) => Promise<MeasurementResponseDto>
  deleteMeasurement: (input: DeleteMeasurementInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for experiment measurement resources.
 */
export const useMeasurementApi = (): UseMeasurementApiComposable => {
  const getMeasurement = async (input: GetMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/hypotheses/${input.hypothesisId}/measurement`)
  }

  const upsertMeasurement = async (input: UpsertMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/hypotheses/${input.hypothesisId}/measurement`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMeasurement = async (input: DeleteMeasurementInput): Promise<void> => {
    await $fetch(`/api/hypotheses/${input.hypothesisId}/measurement`, {
      method: 'DELETE'
    })
  }

  return {
    getMeasurement,
    upsertMeasurement,
    deleteMeasurement
  }
}
