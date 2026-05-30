import type { CanvasElementResponseDto, ReplaceIdeaVersionCanvasBodyDto } from '#shared/types/canvas'
import { CANVAS_SECTION_ORDER, createEmptyCanvasDraft, type CanvasDraftState, type CanvasSectionType } from '~/types/canvasSections'

/**
 * Public contract for loading and replacing one idea version canvas snapshot.
 *
 * `hasError` is set to true when load/save fails with a non-rate-limit error.
 * `hasUnsavedChanges` compares trimmed draft content against the last persisted snapshot.
 */
export interface UseCanvasComposable {
  sectionOrder: readonly CanvasSectionType[]
  draft: Ref<CanvasDraftState>
  hasUnsavedChanges: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isSaving: Ref<boolean>
  hasError: Ref<boolean>
  loadCanvas: (input: { ideaId: string, versionId: string }) => Promise<void>
  saveCanvas: (input: { ideaId: string, versionId: string }) => Promise<boolean>
}

/**
 * Handles canvas state and API orchestration for the idea workspace canvas page.
 */
export const useCanvas = (): UseCanvasComposable => {
  const { getCanvas, replaceCanvas: replaceCanvasRequest } = useCanvasApi()
  const { handleRateLimitError } = useErrorHandler()
  const { createReplaceCanvasSchema } = useValidation()

  const sectionOrder = CANVAS_SECTION_ORDER

  const elements = ref<CanvasElementResponseDto[]>([])
  const draft = ref<CanvasDraftState>(createEmptyCanvasDraft())
  const persistedSnapshot = ref<string>('')
  const isLoading = ref(false)
  const isSaving = ref(false)
  const hasError = ref(false)

  /**
   * Creates a deterministic snapshot used to detect unsaved draft changes.
   */
  const createSnapshot = (state: CanvasDraftState): string => {
    return JSON.stringify(sectionOrder.map(section => [section, state[section].trim()]))
  }

  /**
   * Converts one section text area into normalized canvas element entries.
   */
  const parseSectionToEntries = (
    section: CanvasSectionType,
    text: string
  ): Array<{ type: CanvasSectionType, content: string }> => {
    return text
      .split('\n')
      .map(line => line.trim())
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0)
      .map(content => ({ type: section, content }))
  }

  /**
   * Synchronizes draft text areas from persisted canvas elements.
   *
   * Every non-empty entry is normalized as one bullet line for editing.
   */
  const syncDraftFromElements = (): void => {
    const nextDraft = createEmptyCanvasDraft()

    for (const section of sectionOrder) {
      const sectionItems = elements.value
        .filter(item => item.type === section)
        .map(item => item.content.trim())
        .filter(content => content.length > 0)

      nextDraft[section] = sectionItems.length > 0
        ? sectionItems.map(content => `• ${content}`).join('\n')
        : ''
    }

    draft.value = nextDraft
    persistedSnapshot.value = createSnapshot(nextDraft)
  }

  const hasUnsavedChanges = computed(() => {
    return createSnapshot(draft.value) !== persistedSnapshot.value
  })

  /**
    * Loads canvas entries for the given idea/version pair.
    *
    * On non-rate-limit failures, local elements are reset to an empty draft.
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
      syncDraftFromElements()
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      hasError.value = true
      elements.value = []
      syncDraftFromElements()
    } finally {
      isLoading.value = false
    }
  }

  /**
    * Replaces the complete canvas snapshot and updates local state with the persisted result.
    *
    * Returns false when frontend validation fails, the request fails,
    * or a rate-limit error was handled globally.
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

      const replaceCanvasSchema = createReplaceCanvasSchema()
      const validationResult = replaceCanvasSchema.safeParse({
        elements: normalizedElements
      })

      if (!validationResult.success) {
        hasError.value = true
        return false
      }

      const response = await replaceCanvasRequest({
        ideaId: input.ideaId,
        versionId: input.versionId,
        elements: validationResult.data.elements
      })

      elements.value = response.elements
      syncDraftFromElements()
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
   * Converts the current draft to payload and persists it.
   *
   * Each non-empty line becomes one canvas element and leading list markers are removed.
   */
  const saveCanvas = async (input: { ideaId: string, versionId: string }): Promise<boolean> => {
    const payload = sectionOrder.flatMap(section => parseSectionToEntries(section, draft.value[section]))

    return replaceCanvas({
      ideaId: input.ideaId,
      versionId: input.versionId,
      elements: payload
    })
  }

  return {
    sectionOrder,
    draft,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    hasError,
    loadCanvas,
    saveCanvas
  }
}
