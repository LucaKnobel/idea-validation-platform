import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Public contract for workspace header version controls and actions.
 */
export interface UseIdeaVersionOverviewComposable {
  hasVersionContext: ComputedRef<boolean>
  versionItems: ComputedRef<DropdownMenuItem[][]>
  versionLabel: ComputedRef<string>
  isVersionsLoading: Ref<boolean>
  isCreatingVersion: Ref<boolean>
  isIterationConfirmOpen: Ref<boolean>
  isPivotConfirmOpen: Ref<boolean>
  openIterationConfirm: () => void
  openPivotConfirm: () => void
  closeIterationConfirm: () => void
  closePivotConfirm: () => void
  confirmCreateIteration: () => Promise<void>
  confirmCreatePivot: () => Promise<void>
}

/**
 * Encapsulates workspace header version loading, switching and confirmed create-version workflows.
 */
export const useIdeaVersionOverview = (): UseIdeaVersionOverviewComposable => {
  const { ideaId, versionId, hasIdeaVersionRouteParams } = useIdeaVersionRouteParams()
  const localePath = useLocalePath()
  const { t } = useI18n()
  const { showSuccess, showError } = useToastNotification()
  const { listIdeaVersions, createIdeaVersion } = useIdeaVersionsApi()
  const {
    isOpen: isIterationConfirmOpen,
    open: openIterationConfirm,
    close: closeIterationConfirm
  } = useModalState()
  const {
    isOpen: isPivotConfirmOpen,
    open: openPivotConfirm,
    close: closePivotConfirm
  } = useModalState()
  const isCreatingVersion = ref(false)

  /**
   * Closes both action modals. Used after successful creation and on route version changes
   * to keep UI state in sync with navigation.
   */
  const closeAllConfirmModals = (): void => {
    closeIterationConfirm()
    closePivotConfirm()
  }

  /**
   * Loads all versions for the current idea.
   * Refetches automatically when idea/version route params change.
   */
  const {
    data: versionsResponse,
    pending: isVersionsLoading
  } = useAsyncData<IdeaVersionsListResponseDto>(
    () => `idea-versions-overview:${ideaId.value}:${versionId.value}`,
    async () => {
      if (!hasIdeaVersionRouteParams.value) {
        return { items: [] }
      }

      return await listIdeaVersions({ ideaId: ideaId.value })
    },
    {
      default: () => ({ items: [] }),
      watch: [ideaId, versionId]
    }
  )

  /**
   * Maps backend versions into dropdown menu items.
   * Keeps the currently active version visually highlighted via icon.
   */
  const versionItems = computed<DropdownMenuItem[][]>(() => {
    const items = versionsResponse.value?.items ?? []

    return [items.map(item => ({
      label: `${t('ideaWorkspace.labels.version')} ${item.versionNumber}`,
      to: localePath(`/ideas/${ideaId.value}/versions/${item.id}/overview`),
      icon: item.id === versionId.value ? 'i-lucide-circle-dot' : 'i-lucide-circle'
    }))]
  })

  /**
   * Human-readable label for the currently active version in the header switcher.
   */
  const versionLabel = computed(() => {
    const current = versionsResponse.value?.items.find(item => item.id === versionId.value)
    return current ? `${t('ideaWorkspace.labels.version')} ${current.versionNumber}` : t('ideaWorkspace.labels.version')
  })

  /**
   * Creates a new version (iteration or pivot) from the current version.
   * Includes optimistic UI guards, user feedback, modal cleanup and redirect.
   */
  const createVersion = async (type: CreateIdeaVersionBodyDto['type']): Promise<void> => {
    if (!hasIdeaVersionRouteParams.value || isCreatingVersion.value) {
      return
    }

    isCreatingVersion.value = true

    try {
      const created = await createIdeaVersion({
        ideaId: ideaId.value,
        baseVersionId: versionId.value,
        type
      })

      showSuccess(
        type === 'ITERATION'
          ? 'ideaWorkspace.versionActions.success.iteration.title'
          : 'ideaWorkspace.versionActions.success.pivot.title',
        type === 'ITERATION'
          ? 'ideaWorkspace.versionActions.success.iteration.message'
          : 'ideaWorkspace.versionActions.success.pivot.message'
      )

      closeAllConfirmModals()

      await navigateTo(localePath(`/ideas/${ideaId.value}/versions/${created.id}/overview`))
    } catch {
      showError('ideaWorkspace.versionActions.error.title', 'ideaWorkspace.versionActions.error.message')
    } finally {
      isCreatingVersion.value = false
    }
  }

  /**
   * Thin wrappers to keep template/event handlers explicit and intention-revealing.
   */
  const confirmCreateIteration = async (): Promise<void> => {
    await createVersion('ITERATION')
  }

  const confirmCreatePivot = async (): Promise<void> => {
    await createVersion('PIVOT')
  }

  /**
   * Ensures stale confirm dialogs are closed when the active version route changes.
   */
  watch(versionId, () => {
    closeAllConfirmModals()
  })

  return {
    hasVersionContext: hasIdeaVersionRouteParams,
    versionItems,
    versionLabel,
    isVersionsLoading,
    isCreatingVersion,
    isIterationConfirmOpen,
    isPivotConfirmOpen,
    openIterationConfirm,
    openPivotConfirm,
    closeIterationConfirm,
    closePivotConfirm,
    confirmCreateIteration,
    confirmCreatePivot
  }
}
