import type { TimelineItem } from '@nuxt/ui'

/**
 * Public contract for the idea version history timeline state.
 */
export interface UseIdeaVersionHistoryComposable {
  versions: ComputedRef<IdeaVersionsListResponseDto['items']>
  sortedVersions: ComputedRef<IdeaVersionsListResponseDto['items']>
  currentVersion: ComputedRef<IdeaVersionsListResponseDto['items'][number] | null>
  timelineItems: ComputedRef<TimelineItem[]>
  pending: Ref<boolean>
  error: Ref<unknown>
}

/**
 * Loads all versions for the current idea and maps them to vertical timeline items.
 */
export const useIdeaVersionHistory = (input: {
  ideaId: ComputedRef<string>
  versionId: ComputedRef<string>
}): UseIdeaVersionHistoryComposable => {
  const { t } = useI18n()
  const { listIdeaVersions } = useIdeaVersionsApi()

  /**
   * Loads all versions for the current idea.
   * Refetches when idea or route version changes.
   */
  const {
    data: versionsResponse,
    pending,
    error
  } = useAsyncData<IdeaVersionsListResponseDto>(
    () => `idea-versions-history:${input.ideaId.value}:${input.versionId.value}`,
    async () => {
      if (!input.ideaId.value) {
        return { items: [] }
      }

      return await listIdeaVersions({ ideaId: input.ideaId.value })
    },
    {
      default: () => ({ items: [] }),
      watch: [input.ideaId, input.versionId]
    }
  )

  const versions = computed(() => versionsResponse.value?.items ?? [])

  /**
   * Versions sorted ascending by versionNumber for chronological timeline display.
   */
  const sortedVersions = computed(() => {
    return [...versions.value].sort((left, right) => left.versionNumber - right.versionNumber)
  })

  /**
   * Locates the currently active version from route params.
   * Used for highlighting the active item in the timeline.
   */
  const currentVersion = computed(() => {
    return sortedVersions.value.find(item => item.id === input.versionId.value) ?? null
  })

  /**
   * Converts version type enum to human-readable label for timeline display.
   */
  const typeLabel = (type: 'INITIAL' | 'ITERATION' | 'PIVOT'): string => {
    if (type === 'INITIAL') {
      return t('ideaWorkspace.historyPage.timeline.type.initial')
    }

    if (type === 'PIVOT') {
      return t('ideaWorkspace.historyPage.timeline.type.pivot')
    }

    return t('ideaWorkspace.historyPage.timeline.type.iteration')
  }

  /**
   * Transforms sorted versions into Nuxt UI timeline items.
   * Highlights the current version, assigns appropriate icons (flag/repeat/branch),
   * and includes lineage information (derived-from or starting-point).
   */
  const timelineItems = computed<TimelineItem[]>(() => {
    return sortedVersions.value.map((item) => {
      const isCurrent = item.id === currentVersion.value?.id
      const variantLabel = typeLabel(item.type)
      const lineageText = item.parentVersionNumber
        ? t('ideaWorkspace.historyPage.timeline.description.derivedFromVersion', { versionNumber: item.parentVersionNumber })
        : t('ideaWorkspace.historyPage.timeline.description.startingPoint')

      return {
        value: item.id,
        date: item.createdAt ?? new Date(),
        title: t('ideaWorkspace.historyPage.timeline.title', {
          versionNumber: item.versionNumber,
          typeLabel: variantLabel
        }),
        description: lineageText,
        icon: item.type === 'PIVOT'
          ? 'i-lucide-git-branch'
          : item.type === 'INITIAL'
            ? 'i-lucide-flag'
            : 'i-lucide-repeat',
        color: isCurrent ? 'primary' : 'neutral'
      }
    })
  })

  return {
    versions,
    sortedVersions,
    currentVersion,
    timelineItems,
    pending,
    error
  }
}
