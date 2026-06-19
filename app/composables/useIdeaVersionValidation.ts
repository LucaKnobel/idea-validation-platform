import type { IdeaVersionValidationOverviewResponseDto } from '#shared/types/validation'

/**
 * Public contract for loading one idea version validation summary.
 */
export interface UseIdeaVersionValidationComposable {
  validationSummary: Ref<IdeaVersionValidationOverviewResponseDto | null>
  isLoading: Ref<boolean>
  hasError: Ref<boolean>
  loadValidationSummary: (input: { ideaId: string, versionId: string }) => Promise<void>
}

/**
 * Handles validation summary state and API orchestration for the idea workspace overview page.
 */
export const useIdeaVersionValidation = (): UseIdeaVersionValidationComposable => {
  const { getValidationSummary } = useIdeaVersionValidationApi()
  const requestedInput = ref<{ ideaId: string, versionId: string } | null>(null)

  const {
    data,
    error,
    status,
    execute
  } = useAsyncData<IdeaVersionValidationOverviewResponseDto | null>(
    () => {
      if (!requestedInput.value) {
        return 'idea-version-validation:idle'
      }

      return `idea-version-validation:${requestedInput.value.ideaId}:${requestedInput.value.versionId}`
    },
    async () => {
      if (!requestedInput.value) {
        return null
      }

      return await getValidationSummary(requestedInput.value)
    },
    {
      immediate: false,
      default: () => null
    }
  )

  const validationSummary = computed(() => data.value)
  const isLoading = computed(() => status.value === 'pending')
  const hasError = computed(() => Boolean(error.value))

  const loadValidationSummary = async (input: { ideaId: string, versionId: string }): Promise<void> => {
    requestedInput.value = input
    await execute()
  }

  return {
    validationSummary,
    isLoading,
    hasError,
    loadValidationSummary
  }
}
