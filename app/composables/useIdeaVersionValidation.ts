import type { IdeaVersionValidationOverviewResponseDto } from '#shared/types/validation'

/**
 * Public contract for loading one idea version validation summary.
 */
export interface UseIdeaVersionValidationComposable {
  validationSummary: ComputedRef<IdeaVersionValidationOverviewResponseDto | null>
  isLoading: ComputedRef<boolean>
  hasError: ComputedRef<boolean>
}

/**
 * Handles validation summary state and API orchestration for the idea workspace overview page.
 * Fetches server-side and hydrates cleanly via useAsyncData.
 */
export const useIdeaVersionValidation = (input: {
  ideaId: ComputedRef<string>
  versionId: ComputedRef<string>
}): UseIdeaVersionValidationComposable => {
  const { getValidationSummary } = useIdeaVersionValidationApi()

  const {
    data,
    error,
    status
  } = useAsyncData<IdeaVersionValidationOverviewResponseDto | null>(
    () => `idea-version-validation:${input.ideaId.value}:${input.versionId.value}`,
    async () => {
      if (!input.ideaId.value || !input.versionId.value) {
        return null
      }

      return await getValidationSummary({
        ideaId: input.ideaId.value,
        versionId: input.versionId.value
      })
    },
    {
      default: () => null,
      watch: [input.ideaId, input.versionId]
    }
  )

  const validationSummary = computed(() => data.value)
  const isLoading = computed(() => status.value === 'pending')
  const hasError = computed(() => Boolean(error.value))

  return {
    validationSummary,
    isLoading,
    hasError
  }
}
