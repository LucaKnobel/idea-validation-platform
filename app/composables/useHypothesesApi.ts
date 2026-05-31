/**
 * Public contract implemented by useHypothesesApi.
 */
export interface UseHypothesesApiComposable {
  listHypotheses: (input: {
    ideaId: string
    versionId: string
  }) => Promise<HypothesesListResponseDto>
  createHypothesis: (input: {
    ideaId: string
    versionId: string
    body: CreateHypothesisBodyDto
  }) => Promise<HypothesisResponseDto>
  updateHypothesis: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: UpdateHypothesisBodyDto
  }) => Promise<HypothesisResponseDto>
  deleteHypothesis: (input: {
    ideaId: string
    versionId: string
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

  const createHypothesis = async (input: {
    ideaId: string
    versionId: string
    body: CreateHypothesisBodyDto
  }): Promise<HypothesisResponseDto> => {
    return $fetch<HypothesisResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateHypothesis = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: UpdateHypothesisBodyDto
  }): Promise<HypothesisResponseDto> => {
    return $fetch<HypothesisResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteHypothesis = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<void> => {
    await $fetch(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}`, {
      method: 'DELETE'
    })
  }

  return {
    listHypotheses,
    createHypothesis,
    updateHypothesis,
    deleteHypothesis
  }
}
