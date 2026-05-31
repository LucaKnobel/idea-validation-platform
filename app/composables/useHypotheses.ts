/**
 * Public contract for loading and mutating hypotheses in one idea version.
 */
export interface UseHypothesesComposable {
  hypotheses: Ref<HypothesisResponseDto[]>
  isLoading: Ref<boolean>
  isCreating: Ref<boolean>
  isDeletingId: Ref<string | null>
  isUpdatingId: Ref<string | null>
  hasError: Ref<boolean>
  loadHypotheses: (input: { ideaId: string, versionId: string }) => Promise<void>
  createHypothesis: (input: {
    ideaId: string
    versionId: string
    body: CreateHypothesisBodyDto
  }) => Promise<HypothesisResponseDto | null>
  updateHypothesis: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: UpdateHypothesisBodyDto
  }) => Promise<HypothesisResponseDto | null>
  deleteHypothesis: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }) => Promise<boolean>
}

/**
 * Handles hypothesis list state and CRUD orchestration for the idea workspace hypotheses page.
 */
export const useHypotheses = (): UseHypothesesComposable => {
  const {
    listHypotheses,
    createHypothesis: createHypothesisRequest,
    updateHypothesis: updateHypothesisRequest,
    deleteHypothesis: deleteHypothesisRequest
  } = useHypothesesApi()
  const { handleRateLimitError } = useErrorHandler()

  const hypotheses = ref<HypothesisResponseDto[]>([])
  const isLoading = ref(false)
  const isCreating = ref(false)
  const isUpdatingId = ref<string | null>(null)
  const isDeletingId = ref<string | null>(null)
  const hasError = ref(false)

  const uniqueSectionTypes = <T extends string>(values: T[]): T[] => {
    return [...new Set(values)]
  }

  const sortByNewest = (items: HypothesisResponseDto[]): HypothesisResponseDto[] => {
    return [...items].sort((left, right) => {
      return Date.parse(right.createdAt) - Date.parse(left.createdAt)
    })
  }

  const loadHypotheses = async (input: { ideaId: string, versionId: string }): Promise<void> => {
    isLoading.value = true
    hasError.value = false

    try {
      const response = await listHypotheses(input)
      hypotheses.value = sortByNewest(response.items)
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      hasError.value = true
      hypotheses.value = []
    } finally {
      isLoading.value = false
    }
  }

  const createHypothesis = async (input: {
    ideaId: string
    versionId: string
    body: CreateHypothesisBodyDto
  }): Promise<HypothesisResponseDto | null> => {
    isCreating.value = true
    hasError.value = false

    try {
      const createdHypothesis = await createHypothesisRequest({
        ideaId: input.ideaId,
        versionId: input.versionId,
        body: {
          statement: input.body.statement,
          dimension: input.body.dimension,
          priority: input.body.priority,
          canvasSectionTypes: uniqueSectionTypes(input.body.canvasSectionTypes)
        }
      })

      hypotheses.value = sortByNewest([createdHypothesis, ...hypotheses.value])
      return createdHypothesis
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return null
      }

      hasError.value = true
      return null
    } finally {
      isCreating.value = false
    }
  }

  const updateHypothesis = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: UpdateHypothesisBodyDto
  }): Promise<HypothesisResponseDto | null> => {
    isUpdatingId.value = input.hypothesisId
    hasError.value = false

    try {
      const updatedHypothesis = await updateHypothesisRequest({
        ideaId: input.ideaId,
        versionId: input.versionId,
        hypothesisId: input.hypothesisId,
        body: {
          statement: input.body.statement,
          dimension: input.body.dimension,
          priority: input.body.priority,
          canvasSectionTypes: uniqueSectionTypes(input.body.canvasSectionTypes)
        }
      })

      hypotheses.value = sortByNewest(hypotheses.value.map((hypothesis) => {
        return hypothesis.id === updatedHypothesis.id ? updatedHypothesis : hypothesis
      }))

      return updatedHypothesis
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return null
      }

      hasError.value = true
      return null
    } finally {
      isUpdatingId.value = null
    }
  }

  const deleteHypothesis = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<boolean> => {
    isDeletingId.value = input.hypothesisId
    hasError.value = false

    try {
      await deleteHypothesisRequest(input)
      hypotheses.value = hypotheses.value.filter(hypothesis => hypothesis.id !== input.hypothesisId)
      return true
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return false
      }

      hasError.value = true
      return false
    } finally {
      isDeletingId.value = null
    }
  }

  return {
    hypotheses,
    isLoading,
    isCreating,
    isDeletingId,
    isUpdatingId,
    hasError,
    loadHypotheses,
    createHypothesis,
    updateHypothesis,
    deleteHypothesis
  }
}
