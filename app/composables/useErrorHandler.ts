import { ref } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from '#imports'

export interface UseErrorHandlerComposable {
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
  resetError: () => void
  handleRegistrationError: (error: unknown) => { titleKey: string, textKey: string }
  handleLoginError: (error: unknown) => { titleKey: string, textKey: string }
  handleAccountDeleteError: (error: unknown) => { titleKey: string, textKey: string }
}

export const useErrorHandler = (): UseErrorHandlerComposable => {
  const { t } = useI18n()
  const hasError = ref(false)
  const errorTitle = ref<string | undefined>(undefined)
  const errorText = ref<string | undefined>(undefined)

  const setError = (titleKey: string, textKey: string): void => {
    errorTitle.value = t(titleKey)
    errorText.value = t(textKey)
    hasError.value = true
  }

  const resetError = (): void => {
    errorTitle.value = undefined
    errorText.value = undefined
    hasError.value = false
  }

  const getStatusCode = (error: unknown): number | undefined => {
    if (!error || typeof error !== 'object') {
      return undefined
    }

    const maybeError = error as {
      statusCode?: unknown
      status?: unknown
      response?: { status?: unknown }
      error?: { statusCode?: unknown, status?: unknown }
    }

    const candidates = [
      maybeError.statusCode,
      maybeError.status,
      maybeError.response?.status,
      maybeError.error?.statusCode,
      maybeError.error?.status
    ]

    for (const value of candidates) {
      if (typeof value === 'number') {
        return value
      }
    }

    return undefined
  }

  const handleCommonErrors = (statusCode: number | undefined): { titleKey: string, textKey: string } | null => {
    if (typeof statusCode === 'undefined') {
      const titleKey = 'error.network.title'
      const textKey = 'error.network.message'
      setError(titleKey, textKey)
      return { titleKey, textKey }
    }

    if (statusCode >= 500) {
      const titleKey = 'error.serviceUnavailable.title'
      const textKey = 'error.serviceUnavailable.message'
      setError(titleKey, textKey)
      return { titleKey, textKey }
    }

    return null
  }

  const handleRegistrationError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.auth.registration.title'
    const textKey = 'error.auth.registration.message'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleLoginError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.auth.login.title'
    const textKey = 'error.auth.login.message'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleAccountDeleteError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.account.delete.title'
    const textKey = 'error.account.delete.message'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  return {
    hasError,
    errorTitle,
    errorText,
    resetError,
    handleRegistrationError,
    handleLoginError,
    handleAccountDeleteError
  }
}
