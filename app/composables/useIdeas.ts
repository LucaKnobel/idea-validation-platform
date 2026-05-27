/**
 * Public contract for ideas listing, filtering, pagination and mutations.
 */
export interface UseIdeasComposable {
  ideas: Ref<IdeaResponseDto[]>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  hasActiveSearch: Ref<boolean>
  page: Ref<number>
  pageSize: Ref<number>
  total: Ref<number>
  totalPages: Ref<number>
  searchInput: Ref<string>
  applySearch: () => Promise<void>
  createIdea: (input: { title: string, description?: string }) => Promise<IdeaResponseDto | null>
  deleteIdea: (input: { ideaId: string }) => Promise<boolean>
}

/**
 * Handles listing ideas with server-side search and pagination state for the dashboard UI.
 */
export const useIdeas = (): UseIdeasComposable => {
  const { listIdeas, createIdea: createIdeaRequest, deleteIdea: deleteIdeaRequest } = useIdeasApi()
  const { handleRateLimitError } = useErrorHandler()

  const ideas = ref<IdeaResponseDto[]>([])
  const hasError = ref(false)

  const page = ref(1)
  const pageSize = ref(10)
  const total = ref(0)
  const totalPages = ref(0)

  const searchInput = ref('')
  const activeSearch = ref('')
  const hasActiveSearch = computed(() => activeSearch.value.trim().length > 0)
  const isLoading = ref(false)

  /**
   * Loads ideas for the current page and active query.
   */
  const fetchIdeas = async (): Promise<void> => {
    isLoading.value = true
    hasError.value = false

    try {
      const response: IdeasListResponseDto = await listIdeas({
        page: page.value,
        pageSize: pageSize.value,
        q: activeSearch.value || undefined
      })

      ideas.value = response.items
      total.value = response.total
      totalPages.value = response.totalPages
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      hasError.value = true
      ideas.value = []
      total.value = 0
      totalPages.value = 0
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Normalizes the search input and refreshes the first page when needed.
   */
  const applySearch = async (): Promise<void> => {
    const normalizedQuery = searchInput.value.trim()
    const shouldRefetchCurrentPage = normalizedQuery === activeSearch.value && page.value === 1

    activeSearch.value = normalizedQuery

    if (shouldRefetchCurrentPage) {
      await fetchIdeas()
      return
    }

    if (page.value !== 1) {
      page.value = 1
      return
    }

    await fetchIdeas()
  }

  /**
   * Refreshes the current list state using existing page/search inputs.
   */
  const refresh = async (): Promise<void> => {
    await fetchIdeas()
  }

  /**
   * Creates an idea and keeps pagination state consistent with the dashboard list.
   */
  const createIdea = async (input: { title: string, description?: string }): Promise<IdeaResponseDto | null> => {
    const createdIdea = await createIdeaRequest({
      title: input.title,
      description: input.description
    })

    if (page.value !== 1) {
      page.value = 1
      return createdIdea
    }

    await refresh()
    return createdIdea
  }

  /**
   * Deletes an idea and updates pagination if the current page becomes empty.
   */
  const deleteIdea = async (input: { ideaId: string }): Promise<boolean> => {
    await deleteIdeaRequest(input.ideaId)

    const willRemoveLastItemOnPage = ideas.value.length === 1

    if (willRemoveLastItemOnPage && page.value > 1) {
      page.value -= 1
      return true
    }

    await refresh()
    return true
  }

  /**
   * Reloads data whenever pagination changes.
   */
  watch(page, async () => {
    await fetchIdeas()
  })

  /**
   * Loads the initial idea list when the dashboard page mounts.
   */
  onMounted(async () => {
    await fetchIdeas()
  })

  return {
    ideas,
    isLoading,
    hasError,
    hasActiveSearch,
    page,
    pageSize,
    total,
    totalPages,
    searchInput,
    applySearch,
    createIdea,
    deleteIdea
  }
}
