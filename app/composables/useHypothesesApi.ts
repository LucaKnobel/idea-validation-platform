/**
 * Public contract implemented by useHypothesesApi.
 */
export interface UseHypothesesApiComposable {
  listHypotheses: (input: {
    ideaId: string
    versionId: string
  }) => Promise<HypothesesListResponseDto>
  getHypothesis: (input: {
    hypothesisId: string
  }) => Promise<HypothesisResponseDto>
  createHypothesis: (input: {
    ideaId: string
    versionId: string
    body: UpsertHypothesisBodyDto
  }) => Promise<HypothesisResponseDto>
  updateHypothesis: (input: {
    hypothesisId: string
    body: UpsertHypothesisBodyDto
  }) => Promise<HypothesisResponseDto>
  deleteHypothesis: (input: {
    hypothesisId: string
  }) => Promise<void>
}

/**
 * Encapsulates HTTP calls for idea version hypothesis resources.
 */
export const useHypothesesApi = (): UseHypothesesApiComposable => {
  const listHypotheses = async (input: {
    ideaId: string
    versionId: string
  }): Promise<HypothesesListResponseDto> => {
    return $fetch<HypothesesListResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses`)
  }

  const getHypothesis = async (input: {
    hypothesisId: string
  }): Promise<HypothesisResponseDto> => {
    return $fetch<HypothesisResponseDto>(`/api/hypotheses/${input.hypothesisId}`)
  }

  const createHypothesis = async (input: {
    ideaId: string
    versionId: string
    body: UpsertHypothesisBodyDto
  }): Promise<HypothesisResponseDto> => {
    return $fetch<HypothesisResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateHypothesis = async (input: {
    hypothesisId: string
    body: UpsertHypothesisBodyDto
  }): Promise<HypothesisResponseDto> => {
    return $fetch<HypothesisResponseDto>(`/api/hypotheses/${input.hypothesisId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteHypothesis = async (input: {
    hypothesisId: string
  }): Promise<void> => {
    await $fetch(`/api/hypotheses/${input.hypothesisId}`, {
      method: 'DELETE'
    })
  }

  return {
    listHypotheses,
    getHypothesis,
    createHypothesis,
    updateHypothesis,
    deleteHypothesis
  }
}
