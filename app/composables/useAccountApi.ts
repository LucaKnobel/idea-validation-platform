/**
 * Public contract implemented by useAccountApi.
 */
export interface UseAccountApiComposable {
  /**
   * Permanently deletes the currently authenticated account.
   */
  deleteAccount: () => Promise<void>
}

/**
 * Encapsulates raw HTTP calls for account endpoints.
 */
export const useAccountApi = (): UseAccountApiComposable => {
  const deleteAccount = async (): Promise<void> => {
    await $fetch('/api/users/me', {
      method: 'DELETE'
    })
  }

  return {
    deleteAccount
  }
}
