/**
 * Small wrapper around Nuxt UI toasts that accepts translation keys instead of raw strings.
 */
export interface UseToastNotificationComposable {
  showSuccess: (titleKey: string, messageKey?: string) => void
  showError: (titleKey: string, messageKey?: string) => void
}

/**
 * Creates translated success and error toast helpers for frontend composables.
 */
export const useToastNotification = (): UseToastNotificationComposable => {
  const { t } = useI18n()
  const toast = useToast()

  /**
   * Displays a success toast using i18n keys.
   */
  const showSuccess = (titleKey: string, messageKey?: string): void => {
    toast.add({
      title: t(titleKey),
      description: messageKey ? t(messageKey) : undefined,
      color: 'success'
    })
  }

  /**
   * Displays an error toast using i18n keys.
   */
  const showError = (titleKey: string, messageKey?: string): void => {
    toast.add({
      title: t(titleKey),
      description: messageKey ? t(messageKey) : undefined,
      color: 'error'
    })
  }

  return { showSuccess, showError }
}
