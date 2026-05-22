import type { IdeaResponseDto } from '#shared/types/idea'

export interface CreateIdeaForm {
  title: string
  description: string
}

export interface UseCreateIdeaModalOptions {
  createIdea: (input: { title: string, description?: string }) => Promise<IdeaResponseDto | null>
}

/**
 * Encapsulates the dashboard create-idea modal state and submit flow.
 */
export const useCreateIdeaModal = (options: UseCreateIdeaModalOptions) => {
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

  const resetCreateIdeaForm = (): void => {
    createIdeaFormState.title = ''
    createIdeaFormState.description = ''
  }

  const openCreateIdeaModal = (): void => {
    resetCreateIdeaForm()
    isCreateModalOpen.value = true
  }

  const closeCreateIdeaModal = (): void => {
    if (isCreatingIdea.value) {
      return
    }

    isCreateModalOpen.value = false
  }

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
    closeCreateIdeaModal,
    submitCreateIdea
  }
}
