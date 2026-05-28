/**
 * Dependencies required for the idea deletion flow.
 */
export interface UseIdeaDeleteOptions {
  ideaId: MaybeRefOrGetter<string>
}

/**
 * Public contract implemented by useIdeaDelete.
 */
export interface UseIdeaDeleteComposable {
  isDeleteModalOpen: Ref<boolean>
  isDeletingIdea: Ref<boolean>
  openDeleteModal: () => void
  closeDeleteModal: () => void
  confirmDeleteIdea: () => Promise<void>
}

/**
 * Encapsulates idea deletion state, API call handling and post-delete navigation.
 */
export const useIdeaDelete = (options: UseIdeaDeleteOptions): UseIdeaDeleteComposable => {
  const localePath = useLocalePath()
  const { deleteIdea } = useIdeasApi()
  const { showSuccess, showError } = useToastNotification()
  const { handleRateLimitError } = useErrorHandler()

  const isDeleteModalOpen = ref(false)
  const isDeletingIdea = ref(false)

  /**
   * Opens the deletion confirmation modal.
   */
  const openDeleteModal = (): void => {
    isDeleteModalOpen.value = true
  }

  /**
   * Closes the modal unless a deletion request is currently running.
   */
  const closeDeleteModal = (): void => {
    if (isDeletingIdea.value) {
      return
    }

    isDeleteModalOpen.value = false
  }

  /**
   * Deletes the current idea and navigates back to the dashboard on success.
   */
  const confirmDeleteIdea = async (): Promise<void> => {
    const resolvedIdeaId = toValue(options.ideaId).trim()

    if (!resolvedIdeaId || isDeletingIdea.value) {
      return
    }

    isDeletingIdea.value = true

    try {
      await deleteIdea(resolvedIdeaId)

      showSuccess('dashboard.delete.success.title', 'dashboard.delete.success.message')

      isDeleteModalOpen.value = false
      await navigateTo(localePath('/dashboard'))
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      showError('dashboard.delete.error.title', 'dashboard.delete.error.message')
    } finally {
      isDeletingIdea.value = false
    }
  }

  return {
    isDeleteModalOpen,
    isDeletingIdea,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteIdea
  }
}
