export type ListExperimentsInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
}

export type CreateExperimentInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  body: CreateExperimentBodyDto
}

export type UpdateExperimentInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
  body: UpdateExperimentBodyDto
}

export type DeleteExperimentInput = {
  ideaId: string
  versionId: string
  hypothesisId: string
  experimentId: string
}

/**
 * Public contract implemented by useExperimentsApi.
 */
export interface UseExperimentsApiComposable {
  listExperiments: (input: ListExperimentsInput) => Promise<ExperimentsListResponseDto>
  createExperiment: (input: CreateExperimentInput) => Promise<ExperimentResponseDto>
  updateExperiment: (input: UpdateExperimentInput) => Promise<ExperimentResponseDto>
  deleteExperiment: (input: DeleteExperimentInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for hypothesis experiment resources.
 */
export const useExperimentsApi = (): UseExperimentsApiComposable => {
  const listExperiments = async (input: ListExperimentsInput): Promise<ExperimentsListResponseDto> => {
    return $fetch<ExperimentsListResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments`)
  }

  const createExperiment = async (input: CreateExperimentInput): Promise<ExperimentResponseDto> => {
    return $fetch<ExperimentResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateExperiment = async (input: UpdateExperimentInput): Promise<ExperimentResponseDto> => {
    return $fetch<ExperimentResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteExperiment = async (input: DeleteExperimentInput): Promise<void> => {
    await $fetch(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/experiments/${input.experimentId}`, {
      method: 'DELETE'
    })
  }

  return {
    listExperiments,
    createExperiment,
    updateExperiment,
    deleteExperiment
  }
}
