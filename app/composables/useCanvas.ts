import type { CanvasElementResponseDto, ReplaceIdeaVersionCanvasBodyDto } from '../../shared/types/canvas'

export type CanvasSectionType = ReplaceIdeaVersionCanvasBodyDto['elements'][number]['type']
export type CanvasDraftState = Record<CanvasSectionType, string>

export interface CanvasSectionMeta {
  labelKey: string
  icon: string
}

/**
 * Public contract for loading and replacing one idea version canvas snapshot.
 */
export interface UseCanvasComposable {
  sectionOrder: readonly CanvasSectionType[]
  sectionMeta: Readonly<Record<CanvasSectionType, CanvasSectionMeta>>
  sectionLayoutClass: Readonly<Record<CanvasSectionType, string>>
  elements: Ref<CanvasElementResponseDto[]>
  draft: Ref<CanvasDraftState>
  hasUnsavedChanges: ComputedRef<boolean>
  isLoading: Ref<boolean>
  isSaving: Ref<boolean>
  hasError: Ref<boolean>
  loadCanvas: (input: { ideaId: string, versionId: string }) => Promise<void>
  reloadCanvas: (input: { ideaId: string, versionId: string }) => Promise<void>
  replaceCanvas: (input: {
    ideaId: string
    versionId: string
    elements: ReplaceIdeaVersionCanvasBodyDto['elements']
  }) => Promise<boolean>
  saveCanvas: (input: { ideaId: string, versionId: string }) => Promise<boolean>
  setElements: (nextElements: CanvasElementResponseDto[]) => void
  reset: () => void
}

/**
 * Handles canvas state and API orchestration for the idea workspace canvas page.
 */
export const useCanvas = (): UseCanvasComposable => {
  const { getCanvas, replaceCanvas: replaceCanvasRequest } = useCanvasApi()
  const { handleRateLimitError } = useErrorHandler()
  const { createReplaceCanvasSchema } = useValidation()

  const sectionOrder: CanvasSectionType[] = [
    'KEY_PARTNERS',
    'KEY_ACTIVITIES',
    'VALUE_PROPOSITIONS',
    'CUSTOMER_RELATIONSHIPS',
    'CUSTOMER_SEGMENTS',
    'KEY_RESOURCES',
    'CHANNELS',
    'COST_STRUCTURE',
    'REVENUE_STREAMS'
  ]

  const sectionMeta: Record<CanvasSectionType, CanvasSectionMeta> = {
    KEY_PARTNERS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.KEY_PARTNERS',
      icon: 'i-lucide-link-2'
    },
    KEY_ACTIVITIES: {
      labelKey: 'ideaWorkspace.canvasPage.sections.KEY_ACTIVITIES',
      icon: 'i-lucide-zap'
    },
    VALUE_PROPOSITIONS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.VALUE_PROPOSITIONS',
      icon: 'i-lucide-gift'
    },
    CUSTOMER_RELATIONSHIPS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.CUSTOMER_RELATIONSHIPS',
      icon: 'i-lucide-heart'
    },
    CUSTOMER_SEGMENTS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.CUSTOMER_SEGMENTS',
      icon: 'i-lucide-users'
    },
    KEY_RESOURCES: {
      labelKey: 'ideaWorkspace.canvasPage.sections.KEY_RESOURCES',
      icon: 'i-lucide-factory'
    },
    CHANNELS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.CHANNELS',
      icon: 'i-lucide-truck'
    },
    COST_STRUCTURE: {
      labelKey: 'ideaWorkspace.canvasPage.sections.COST_STRUCTURE',
      icon: 'i-lucide-tag'
    },
    REVENUE_STREAMS: {
      labelKey: 'ideaWorkspace.canvasPage.sections.REVENUE_STREAMS',
      icon: 'i-lucide-wallet'
    }
  }

  const sectionLayoutClass: Record<CanvasSectionType, string> = {
    KEY_PARTNERS: 'lg:col-span-2 lg:row-span-4',
    KEY_ACTIVITIES: 'lg:col-span-2 lg:row-span-2',
    VALUE_PROPOSITIONS: 'lg:col-span-2 lg:row-span-4',
    CUSTOMER_RELATIONSHIPS: 'lg:col-span-2 lg:row-span-2',
    CUSTOMER_SEGMENTS: 'lg:col-span-2 lg:row-span-4',
    KEY_RESOURCES: 'lg:col-span-2 lg:row-span-2',
    CHANNELS: 'lg:col-span-2 lg:row-span-2',
    COST_STRUCTURE: 'lg:col-span-5 lg:row-span-2',
    REVENUE_STREAMS: 'lg:col-span-5 lg:row-span-2'
  }

  /**
   * Creates an empty draft object for all canvas sections.
   */
  const createEmptyDraft = (): CanvasDraftState => {
    return {
      KEY_PARTNERS: '',
      KEY_ACTIVITIES: '',
      VALUE_PROPOSITIONS: '',
      CUSTOMER_RELATIONSHIPS: '',
      CUSTOMER_SEGMENTS: '',
      KEY_RESOURCES: '',
      CHANNELS: '',
      COST_STRUCTURE: '',
      REVENUE_STREAMS: ''
    }
  }

  const elements = ref<CanvasElementResponseDto[]>([])
  const draft = ref<CanvasDraftState>(createEmptyDraft())
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
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .filter(line => line.length > 0)
      .map(content => ({ type: section, content }))
  }

  /**
   * Synchronizes draft text areas from persisted canvas elements.
   */
  const syncDraftFromElements = (): void => {
    const nextDraft = createEmptyDraft()

    for (const section of sectionOrder) {
      const sectionItems = elements.value
        .filter(item => item.type === section)
        .map(item => item.content.trim())
        .filter(content => content.length > 0)

      nextDraft[section] = sectionItems.length > 0
        ? sectionItems.map(content => `- ${content}`).join('\n')
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
   * High-level reload action used by the canvas page.
   */
  const reloadCanvas = async (input: { ideaId: string, versionId: string }): Promise<void> => {
    await loadCanvas(input)
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
   */
  const saveCanvas = async (input: { ideaId: string, versionId: string }): Promise<boolean> => {
    const payload = sectionOrder.flatMap(section => parseSectionToEntries(section, draft.value[section]))

    return await replaceCanvas({
      ideaId: input.ideaId,
      versionId: input.versionId,
      elements: payload
    })
  }

  /**
   * Replaces local canvas state without a network call.
   */
  const setElements = (nextElements: CanvasElementResponseDto[]): void => {
    elements.value = [...nextElements]
    syncDraftFromElements()
  }

  /**
   * Resets local canvas state.
   */
  const reset = (): void => {
    elements.value = []
    draft.value = createEmptyDraft()
    persistedSnapshot.value = createSnapshot(draft.value)
    isLoading.value = false
    isSaving.value = false
    hasError.value = false
  }

  return {
    sectionOrder,
    sectionMeta,
    sectionLayoutClass,
    elements,
    draft,
    hasUnsavedChanges,
    isLoading,
    isSaving,
    hasError,
    loadCanvas,
    reloadCanvas,
    replaceCanvas,
    saveCanvas,
    setElements,
    reset
  }
}
