/**
 * Options for one rate-limit-aware request execution.
 */
interface RunWithErrorHandlingOptions<T> {
  fallback: T
  onError?: () => void
}

/**
 * Public API for shared request error state and error-aware execution.
 */
export interface UseRequestErrorStateComposable {
  hasError: Ref<boolean>
  resetRequestError: () => void
  runWithErrorHandling: <T>(
    operation: () => Promise<T>,
    options: RunWithErrorHandlingOptions<T>
  ) => Promise<T>
}

/**
 * Shares request error state and common rate-limit-aware error handling.
 */
export const useRequestErrorState = (): UseRequestErrorStateComposable => {
  const { handleRateLimitError } = useErrorHandler()
  const hasError = ref(false)

  const resetRequestError = (): void => {
    hasError.value = false
  }

  const runWithErrorHandling = async <T>(
    operation: () => Promise<T>,
    options: RunWithErrorHandlingOptions<T>
  ): Promise<T> => {
    hasError.value = false

    try {
      return await operation()
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return options.fallback
      }

      hasError.value = true
      options.onError?.()
      return options.fallback
    }
  }

  return {
    hasError,
    resetRequestError,
    runWithErrorHandling
  }
}
