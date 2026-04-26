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
  handleAnalysisError: (error: unknown) => { titleKey: string, textKey: string }
  handleCriteriaError: (error: unknown) => { titleKey: string, textKey: string }
  handleAlternativesError: (error: unknown) => { titleKey: string, textKey: string }
  handleRatingsError: (error: unknown) => { titleKey: string, textKey: string }
  handleResultsError: (error: unknown) => { titleKey: string, textKey: string }
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
    const statusCode = (error as { statusCode?: number } | null)?.statusCode
    return typeof statusCode === 'number' ? statusCode : undefined
  }

  const handleCommonErrors = (statusCode: number | undefined): { titleKey: string, textKey: string } | null => {
    if (!statusCode) {
      const titleKey = 'error.network.title'
      const textKey = 'error.network.text'
      setError(titleKey, textKey)
      return { titleKey, textKey }
    }

    if (statusCode >= 500) {
      const titleKey = 'error.serviceUnavailable.title'
      const textKey = 'error.serviceUnavailable.text'
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
    const textKey = 'error.auth.registration.text'
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
    const textKey = 'error.auth.login.text'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleAnalysisError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.analysis.title'
    const textKey = 'error.analysis.text'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleCriteriaError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.criteria.title'
    const textKey = 'error.criteria.text'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleAlternativesError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.alternatives.title'
    const textKey = 'error.alternatives.text'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleRatingsError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.ratings.title'
    const textKey = 'error.ratings.text'
    setError(titleKey, textKey)
    return { titleKey, textKey }
  }

  const handleResultsError = (error: unknown): { titleKey: string, textKey: string } => {
    const statusCode = getStatusCode(error)
    if (statusCode === 422) {
      const titleKey = 'error.results.weightSum.title'
      const textKey = 'error.results.weightSum.text'
      setError(titleKey, textKey)
      return { titleKey, textKey }
    }
    if (statusCode === 409) {
      const titleKey = 'error.results.missingRatings.title'
      const textKey = 'error.results.missingRatings.text'
      setError(titleKey, textKey)
      return { titleKey, textKey }
    }
    const commonError = handleCommonErrors(statusCode)
    if (commonError) {
      return commonError
    }
    const titleKey = 'error.results.title'
    const textKey = 'error.results.text'
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
    const textKey = 'error.account.delete.text'
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
    handleAnalysisError,
    handleCriteriaError,
    handleAlternativesError,
    handleRatingsError,
    handleResultsError,
    handleAccountDeleteError
  }
}
