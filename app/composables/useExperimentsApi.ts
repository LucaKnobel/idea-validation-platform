export type GetExperimentInput = {
  hypothesisId: string
}

export type UpsertExperimentInput = {
  hypothesisId: string
  body: UpsertExperimentBodyDto
}

export type DeleteExperimentInput = {
  hypothesisId: string
}

/**
 * Public contract implemented by useExperimentsApi.
 */
export interface UseExperimentsApiComposable {
  getExperiment: (input: GetExperimentInput) => Promise<ExperimentResponseDto>
  upsertExperiment: (input: UpsertExperimentInput) => Promise<ExperimentResponseDto>
  deleteExperiment: (input: DeleteExperimentInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for hypothesis experiment resources.
 */
export const useExperimentsApi = (): UseExperimentsApiComposable => {
  const getExperiment = async (input: GetExperimentInput): Promise<ExperimentResponseDto> => {
    return $fetch<ExperimentResponseDto>(`/api/hypotheses/${input.hypothesisId}/experiment`)
  }

  const upsertExperiment = async (input: UpsertExperimentInput): Promise<ExperimentResponseDto> => {
    return $fetch<ExperimentResponseDto>(`/api/hypotheses/${input.hypothesisId}/experiment`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteExperiment = async (input: DeleteExperimentInput): Promise<void> => {
    await $fetch(`/api/hypotheses/${input.hypothesisId}/experiment`, {
      method: 'DELETE'
    })
  }

  return {
    getExperiment,
    upsertExperiment,
    deleteExperiment
  }
}
