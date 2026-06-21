export interface UseSubscriptionApiComposable {
  getSubscriptionStatus: () => Promise<SubscriptionStatusResponseDto>
  cancelSubscription: () => Promise<CancelSubscriptionResponseDto>
}

/**
 * Encapsulates raw HTTP calls for subscription endpoints.
 */
export const useSubscriptionApi = (): UseSubscriptionApiComposable => {
  const getSubscriptionStatus = async (): Promise<SubscriptionStatusResponseDto> => {
    return await $fetch<SubscriptionStatusResponseDto>('/api/subscription/status')
  }

  const cancelSubscription = async (): Promise<CancelSubscriptionResponseDto> => {
    return await $fetch<CancelSubscriptionResponseDto>('/api/subscription/cancel', {
      method: 'POST'
    })
  }

  return {
    getSubscriptionStatus,
    cancelSubscription
  }
}
