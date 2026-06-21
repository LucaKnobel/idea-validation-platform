/**
 * Composable to manage Payrexx checkout URL access.
 * Provides centralized checkout flow entry point.
 */
export const usePayrexxCheckout = () => {
  const config = useRuntimeConfig()
  const payrexxProPageUrl = config.public.payrexxProPageUrl

  /**
   * Gets the Payrexx checkout URL.
   * Throws if not configured.
   */
  const getCheckoutUrl = (): string => {
    if (!payrexxProPageUrl) {
      throw new Error('Payrexx checkout URL is not configured')
    }
    return payrexxProPageUrl
  }

  /**
   * Opens checkout in new tab/window.
   */
  const openCheckout = (): void => {
    const url = getCheckoutUrl()
    window.open(url, '_blank', 'noreferrer')
  }

  /**
   * Navigates to checkout (same tab).
   */
  const navigateToCheckout = (): void => {
    const url = getCheckoutUrl()
    window.location.href = url
  }

  return {
    getCheckoutUrl,
    openCheckout,
    navigateToCheckout,
    payrexxProPageUrl
  }
}
