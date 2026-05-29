import type { CanvasElementResponseDto, ReplaceIdeaVersionCanvasBodyDto } from '../../shared/types/canvas'

/**
 * Public contract for loading and replacing one idea version canvas snapshot.
 */
export interface UseCanvasComposable {
  elements: Ref<CanvasElementResponseDto[]>
  isLoading: Ref<boolean>
  isSaving: Ref<boolean>
  hasError: Ref<boolean>
  loadCanvas: (input: { ideaId: string, versionId: string }) => Promise<void>
  replaceCanvas: (input: {
    ideaId: string
    versionId: string
    elements: ReplaceIdeaVersionCanvasBodyDto['elements']
  }) => Promise<boolean>
  setElements: (nextElements: CanvasElementResponseDto[]) => void
  reset: () => void
}

/**
 * Handles canvas state and API orchestration for the idea workspace canvas page.
 */
export const useCanvas = (): UseCanvasComposable => {
  const { getCanvas, replaceCanvas: replaceCanvasRequest } = useCanvasApi()
  const { handleRateLimitError } = useErrorHandler()

  const elements = ref<CanvasElementResponseDto[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasError = ref(false)

  /**
   * Loads canvas entries for the given idea/version pair.
   */
  const loadCanvas = async (input: { ideaId: string, versionId: string }): Promise<void> => {
    isLoading.value = true
    hasError.value = false

    try {
      const response = await getCanvas({
        ideaId: input.ideaId,
        versionId: input.versionId
      })

      elements.value = response.elements
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      hasError.value = true
      elements.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Replaces the complete canvas snapshot and updates local state with the persisted result.
   */
  const replaceCanvas = async (input: {
    ideaId: string
    versionId: string
    elements: ReplaceIdeaVersionCanvasBodyDto['elements']
  }): Promise<boolean> => {
    isSaving.value = true
    hasError.value = false

    try {
      const normalizedElements = input.elements
        .map(element => ({
          type: element.type,
          content: element.content.trim()
        }))
        .filter(element => element.content.length > 0)

      const response = await replaceCanvasRequest({
        ideaId: input.ideaId,
        versionId: input.versionId,
        elements: normalizedElements
      })

      elements.value = response.elements
      return true
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return false
      }

      hasError.value = true
      return false
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Replaces local canvas state without a network call.
   */
  const setElements = (nextElements: CanvasElementResponseDto[]): void => {
    elements.value = [...nextElements]
  }

  /**
   * Resets local canvas state.
   */
  const reset = (): void => {
    elements.value = []
    isLoading.value = false
    isSaving.value = false
    hasError.value = false
  }

  return {
    elements,
    isLoading,
    isSaving,
    hasError,
    loadCanvas,
    replaceCanvas,
    setElements,
    reset
  }
}
