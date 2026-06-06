/**
 * Public API for guarded async form submission.
 */
export interface UseAsyncSubmitGuardComposable {
  isSubmitting: Ref<boolean>
  runWithSubmitGuard: <T>(operation: () => Promise<T>) => Promise<T | undefined>
}

/**
 * Prevents duplicate async form submits by guarding concurrent execution.
 */
export const useAsyncSubmitGuard = (): UseAsyncSubmitGuardComposable => {
  const isSubmitting = ref(false)

  const runWithSubmitGuard = async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
    if (isSubmitting.value) {
      return undefined
    }

    isSubmitting.value = true

    try {
      return await operation()
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isSubmitting,
    runWithSubmitGuard
  }
}
