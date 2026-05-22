/**
 * Local form state used by the create-idea modal component.
 */
export interface CreateIdeaForm {
  title: string
  description: string
}

/**
 * Dependencies required by the create-idea modal flow.
 */
export interface UseCreateIdeaModalOptions {
  createIdea: (input: { title: string, description?: string }) => Promise<IdeaResponseDto | null>
}

/**
 * Public contract implemented by useCreateIdeaModal.
 */
export interface UseCreateIdeaModalComposable {
  isCreateModalOpen: Ref<boolean>
  isCreatingIdea: Ref<boolean>
  createIdeaFormState: CreateIdeaForm
  createIdeaSchema: ComputedRef<unknown>
  openCreateIdeaModal: () => void
  submitCreateIdea: (input: CreateIdeaForm) => Promise<void>
}

/**
 * Encapsulates the dashboard create-idea modal state and submit flow.
 */
export const useCreateIdeaModal = (options: UseCreateIdeaModalOptions): UseCreateIdeaModalComposable => {
  const localePath = useLocalePath()
  const { showSuccess, showError } = useToastNotification()
  const { handleRateLimitError } = useErrorHandler()
  const { createIdeaFormSchema } = useValidation()
  const { openUpgradeModal } = useUpgradeToProModal()

  const isCreateModalOpen = ref(false)
  const isCreatingIdea = ref(false)
  const createIdeaFormState = reactive<CreateIdeaForm>({
    title: '',
    description: ''
  })

  const createIdeaSchema = computed(() => createIdeaFormSchema())

  /**
   * Resets the create-idea form to its initial empty state.
   */
  const resetCreateIdeaForm = (): void => {
    createIdeaFormState.title = ''
    createIdeaFormState.description = ''
  }

  /**
   * Opens the modal and ensures no stale form values are shown.
   */
  const openCreateIdeaModal = (): void => {
    resetCreateIdeaForm()
    isCreateModalOpen.value = true
  }

  /**
   * Submits a new idea, handles success/error toasts and upgrade gating on 403.
   */
  const submitCreateIdea = async (input: CreateIdeaForm): Promise<void> => {
    if (isCreatingIdea.value) {
      return
    }

    isCreatingIdea.value = true

    try {
      const created = await options.createIdea({
        title: input.title,
        description: input.description.trim() ? input.description : undefined
      })

      if (!created) {
        return
      }

      showSuccess('dashboard.createForm.success.title', 'dashboard.createForm.success.message')

      isCreateModalOpen.value = false
      await navigateTo(localePath(`/idea-workspace/${created.id}`))
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      if (extractStatusCode(error) === 403) {
        isCreateModalOpen.value = false
        openUpgradeModal()
        return
      }

      showError('dashboard.createForm.error.title', 'dashboard.createForm.error.message')
    } finally {
      isCreatingIdea.value = false
    }
  }

  return {
    isCreateModalOpen,
    isCreatingIdea,
    createIdeaFormState,
    createIdeaSchema,
    openCreateIdeaModal,
    submitCreateIdea
  }
}
