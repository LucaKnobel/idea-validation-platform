export interface UseSubscriptionComposable {
  subscriptionStatus: Ref<SubscriptionStatusResponseDto | null>
  isSubscriptionStatusPending: Ref<boolean>
  isCancellingSubscription: Ref<boolean>
  currentPlanLabel: ComputedRef<string>
  currentStatusLabel: ComputedRef<string>
  showSubscribeAction: ComputedRef<boolean>
  showCancelAction: ComputedRef<boolean>
  loadSubscriptionStatus: () => Promise<void>
  startSubscriptionCheckout: () => Promise<void>
  cancelProSubscription: () => Promise<void>
}

/**
 * Provides subscription status and user actions for settings views.
 */
export const useSubscription = (): UseSubscriptionComposable => {
  const { t } = useI18n()
  const { navigateToCheckout } = usePayrexxCheckout()
  const { getSubscriptionStatus, cancelSubscription } = useSubscriptionApi()
  const { showSuccess, showError } = useToastNotification()
  const { handleRateLimitError } = useErrorHandler()

  const subscriptionStatus = ref<SubscriptionStatusResponseDto | null>(null)
  const isSubscriptionStatusPending = ref(true)
  const isCancellingSubscription = ref(false)

  const currentPlanLabel = computed(() => {
    if (!subscriptionStatus.value?.plan) {
      return t('settings.subscription.plan.UNKNOWN')
    }

    return t(`settings.subscription.plan.${subscriptionStatus.value.plan}`)
  })

  const currentStatusLabel = computed(() => {
    if (!subscriptionStatus.value?.status) {
      return t('settings.subscription.status.UNKNOWN')
    }

    return t(`settings.subscription.status.${subscriptionStatus.value.status}`)
  })

  const isProSubscription = computed(() => Boolean(subscriptionStatus.value?.isPro))
  const showSubscribeAction = computed(() => !isSubscriptionStatusPending.value && !isProSubscription.value)
  const showCancelAction = computed(() => !isSubscriptionStatusPending.value && isProSubscription.value)

  /**
   * Loads current subscription status and normalizes non-rate-limit failures to null state.
   */
  const loadSubscriptionStatus = async (): Promise<void> => {
    isSubscriptionStatusPending.value = true

    try {
      subscriptionStatus.value = await getSubscriptionStatus()
    } catch (error: unknown) {
      if (!handleRateLimitError(error)) {
        subscriptionStatus.value = null
      }
    } finally {
      isSubscriptionStatusPending.value = false
    }
  }

  /**
   * Starts checkout and shows a user-safe toast when checkout URL is missing.
   */
  const startSubscriptionCheckout = async (): Promise<void> => {
    try {
      await navigateToCheckout()
    } catch {
      showError('settings.subscription.checkout.error.title', 'settings.subscription.checkout.error.message')
    }
  }

  /**
   * Cancels the current pro subscription and refreshes state afterwards.
   */
  const cancelProSubscription = async (): Promise<void> => {
    if (isCancellingSubscription.value) {
      return
    }

    isCancellingSubscription.value = true

    try {
      await cancelSubscription()

      showSuccess('settings.subscription.cancel.success.title', 'settings.subscription.cancel.success.message')
      await loadSubscriptionStatus()
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return
      }

      if (extractStatusCode(error) === 409) {
        showError('settings.subscription.cancel.unavailable.title', 'settings.subscription.cancel.unavailable.message')
        return
      }

      showError('settings.subscription.cancel.error.title', 'settings.subscription.cancel.error.message')
    } finally {
      isCancellingSubscription.value = false
    }
  }

  onMounted(async () => {
    await loadSubscriptionStatus()
  })

  return {
    subscriptionStatus,
    isSubscriptionStatusPending,
    isCancellingSubscription,
    currentPlanLabel,
    currentStatusLabel,
    showSubscribeAction,
    showCancelAction,
    loadSubscriptionStatus,
    startSubscriptionCheckout,
    cancelProSubscription
  }
}
