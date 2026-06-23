/**
 * Local form state used to edit metadata of the active idea version.
 */
export interface IdeaMetadataForm {
  title: string
  description: string
}

/**
 * Public contract for loading and editing overview metadata.
 */
export interface UseIdeaOverviewMetadataComposable {
  ideaMetadata: ComputedRef<IdeaVersionMetadataDto | null>
  isMetadataLoading: ComputedRef<boolean>
  hasMetadataError: ComputedRef<boolean>
  isEditModalOpen: Ref<boolean>
  isSaving: Ref<boolean>
  metadataFormState: IdeaMetadataForm
  metadataFormSchema: ComputedRef<unknown>
  openEditModal: () => void
  closeEditModal: () => void
  submitEditMetadata: (input: IdeaMetadataForm) => Promise<void>
}

/**
 * Required route context for loading and updating one idea version.
 */
export interface UseIdeaOverviewMetadataInput {
  ideaId: ComputedRef<string>
  versionId: ComputedRef<string>
}

/**
 * Loads current idea-version metadata and provides modal-driven update workflow.
 *
 * Uses useAsyncData so overview metadata is SSR-friendly and route-reactive,
 * and stores title/description in shared useState keys so the workspace layout
 * header stays in sync without an additional request chain.
 */
export const useIdeaOverviewMetadata = (input: UseIdeaOverviewMetadataInput): UseIdeaOverviewMetadataComposable => {
  const { listIdeaVersions, updateIdeaVersion } = useIdeaVersionsApi()
  const { showSuccess, showError } = useToastNotification()
  const { handleRateLimitError } = useErrorHandler()
  const { createIdeaMetadataFormSchema } = useValidation()
  const { isSubmitting: isSaving, runWithSubmitGuard } = useAsyncSubmitGuard()

  /**
   * Shared workspace context consumed by the idea-workspace layout header.
   */
  const workspaceIdeaTitleState = useState<string | null>('workspace-idea-title', () => null)
  const workspaceIdeaDescriptionState = useState<string | null>('workspace-idea-description', () => null)

  const isEditModalOpen = ref(false)

  const metadataFormState = reactive<IdeaMetadataForm>({
    title: '',
    description: ''
  })

  const metadataFormSchema = computed(() => createIdeaMetadataFormSchema())

  /**
   * SSR-friendly metadata loader that refetches when idea/version route params change.
   */
  const {
    data: metadata,
    error,
    status
  } = useAsyncData<IdeaVersionMetadataDto | null>(
    () => `idea-overview-metadata:${input.ideaId.value}:${input.versionId.value}`,
    async () => {
      if (!input.ideaId.value || !input.versionId.value) {
        return null
      }

      const versions = await listIdeaVersions({ ideaId: input.ideaId.value })
      const current = versions.items.find(item => item.id === input.versionId.value)

      return current ?? null
    },
    {
      default: () => null,
      watch: [input.ideaId, input.versionId]
    }
  )

  /**
   * Synchronizes global workspace header state once metadata is available.
   */
  watch(metadata, (value) => {
    if (!value) {
      return
    }

    workspaceIdeaTitleState.value = value.title
    workspaceIdeaDescriptionState.value = value.description
  }, { immediate: true })

  /**
   * Closes stale modal state when navigating between versions.
   */
  watch(input.versionId, () => {
    isEditModalOpen.value = false
  })

  /**
   * Prefills the edit form from freshest metadata and opens the modal.
   */
  const openEditModal = (): void => {
    const current = metadata.value

    metadataFormState.title = current?.title ?? workspaceIdeaTitleState.value ?? ''
    metadataFormState.description = current?.description ?? workspaceIdeaDescriptionState.value ?? ''
    isEditModalOpen.value = true
  }

  /**
   * Closes the metadata edit modal.
   */
  const closeEditModal = (): void => {
    isEditModalOpen.value = false
  }

  /**
   * Persists title/description changes and updates local/shared state optimistically.
   */
  const submitEditMetadata = async (form: IdeaMetadataForm): Promise<void> => {
    if (!input.ideaId.value || !input.versionId.value) {
      return
    }

    await runWithSubmitGuard(async () => {
      try {
        const updated = await updateIdeaVersion({
          ideaId: input.ideaId.value,
          versionId: input.versionId.value,
          title: form.title,
          description: form.description.trim() ? form.description : undefined
        })

        metadata.value = updated
        workspaceIdeaTitleState.value = updated.title
        workspaceIdeaDescriptionState.value = updated.description
        isEditModalOpen.value = false

        showSuccess('ideaWorkspace.overview.metadata.success.title', 'ideaWorkspace.overview.metadata.success.message')
      } catch (error: unknown) {
        if (handleRateLimitError(error)) {
          return
        }

        showError('ideaWorkspace.overview.metadata.error.title', 'ideaWorkspace.overview.metadata.error.message')
      }
    })
  }

  return {
    ideaMetadata: computed(() => metadata.value),
    isMetadataLoading: computed(() => status.value === 'pending'),
    hasMetadataError: computed(() => Boolean(error.value)),
    isEditModalOpen,
    isSaving,
    metadataFormState,
    metadataFormSchema,
    openEditModal,
    closeEditModal,
    submitEditMetadata
  }
}
