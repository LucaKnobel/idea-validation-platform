export type ListMeasurementsInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
}

export type CreateMeasurementInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
  body: CreateMeasurementBodyDto
}

export type UpdateMeasurementInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
  measurementId: string
  body: UpdateMeasurementBodyDto
}

export type DeleteMeasurementInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
  measurementId: string
}

/**
 * Public contract implemented by useMeasurementsApi.
 */
export interface UseMeasurementsApiComposable {
  listMeasurements: (input: ListMeasurementsInput) => Promise<MeasurementsListResponseDto>
  createMeasurement: (input: CreateMeasurementInput) => Promise<MeasurementResponseDto>
  updateMeasurement: (input: UpdateMeasurementInput) => Promise<MeasurementResponseDto>
  deleteMeasurement: (input: DeleteMeasurementInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for experiment measurement resources.
 */
export const useMeasurementsApi = (): UseMeasurementsApiComposable => {
  const listMeasurements = async (input: ListMeasurementsInput): Promise<MeasurementsListResponseDto> => {
    return $fetch<MeasurementsListResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}/measurements`)
  }

  const createMeasurement = async (input: CreateMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}/measurements`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateMeasurement = async (input: UpdateMeasurementInput): Promise<MeasurementResponseDto> => {
    return $fetch<MeasurementResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}/measurements/${input.measurementId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMeasurement = async (input: DeleteMeasurementInput): Promise<void> => {
    await $fetch(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}/measurements/${input.measurementId}`, {
      method: 'DELETE'
    })
  }

  return {
    listMeasurements,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement
  }
}
