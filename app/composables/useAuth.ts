/**
 * Exposes authentication workflows and shared auth-related error state for UI consumers.
 */
export interface UseAuthComposable {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  resendVerificationEmail: (email: string) => Promise<boolean>
  requestPasswordReset: (email: string) => Promise<boolean>
  resetPassword: (newPassword: string, token: string) => Promise<boolean>
  logout: () => Promise<boolean>
  resetError: () => void
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
}

/**
 * Wraps Better Auth client calls behind a small, UI-friendly API.
 *
 * Each action returns `true` on success and `false` when an error message was recorded.
 */
export const useAuth = (): UseAuthComposable => {
  const localePath = useLocalePath()
  const {
    hasError,
    errorTitle,
    errorText,
    resetError,
    handleRegistrationError,
    handleLoginError,
    handlePasswordResetRequestError,
    handlePasswordResetError,
    handleLogoutError
  } = useErrorHandler()

  /**
   * Signs a user in and stores translated error state when the request fails.
   */
  const login = async (email: string, password: string, rememberMe = true): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe
      })

      if (error) {
        handleLoginError(error)
        return false
      }

      return true
    } catch (error: unknown) {
      handleLoginError(error)
      return false
    }
  }

  /**
   * Creates a new account and configures the localized login page as the post-verification target.
   */
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: localePath('/auth/login')
      })

      if (error) {
        handleRegistrationError(error)
        return false
      }

      return true
    } catch (error: unknown) {
      handleRegistrationError(error)
      return false
    }
  }

  /**
   * Requests a new verification email.
   *
   * Returns neutral success for `400` responses to avoid exposing account state.
   */
  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: localePath('/auth/login')
      })

      if (error) {
        // Return neutral success on 400 to avoid account-state disclosure.
        if (extractStatusCode(error) === 400) {
          return true
        }

        handleRegistrationError(error)
        return false
      }

      return true
    } catch (error: unknown) {
      if (extractStatusCode(error) === 400) {
        return true
      }

      handleRegistrationError(error)
      return false
    }
  }

  /**
   * Starts the password reset flow and points the backend to the localized reset page.
   *
   * Returns neutral success for `400` responses to avoid exposing account state.
   */
  const requestPasswordReset = async (email: string): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}${localePath('/auth/reset-password')}`
      })

      if (error) {
        // Return neutral success on 400 to avoid account-state disclosure.
        if (extractStatusCode(error) === 400) {
          return true
        }

        handlePasswordResetRequestError(error)
        return false
      }

      return true
    } catch (error: unknown) {
      if (extractStatusCode(error) === 400) {
        return true
      }

      handlePasswordResetRequestError(error)
      return false
    }
  }

  /**
   * Completes a password reset with the token issued by the reset email.
   */
  const resetPassword = async (newPassword: string, token: string): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.resetPassword({
        newPassword,
        token
      })

      if (error) {
        handlePasswordResetError(error)
        return false
      }

      return true
    } catch (error: unknown) {
      handlePasswordResetError(error)
      return false
    }
  }

  /**
   * Ends the current authenticated session.
   */
  const logout = async (): Promise<boolean> => {
    resetError()

    try {
      await authClient.signOut()
      return true
    } catch (error: unknown) {
      handleLogoutError(error)
      return false
    }
  }

  return { login, register, resendVerificationEmail, requestPasswordReset, resetPassword, logout, resetError, hasError, errorTitle, errorText }
}
