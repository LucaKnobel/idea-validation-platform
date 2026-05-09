export interface UseAuthComposable {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  resendVerificationEmail: (email: string) => Promise<boolean>
  logout: () => Promise<boolean>
  resetError: () => void
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
}

export const useAuth = (): UseAuthComposable => {
  const localePath = useLocalePath()
  const { hasError, errorTitle, errorText, resetError, handleRegistrationError, handleLoginError, handleLogoutError } = useErrorHandler()

  const login = async (email: string, password: string, rememberMe = true): Promise<boolean> => {
    resetError()

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: localePath('/dashboard')
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

  return { login, register, resendVerificationEmail, logout, resetError, hasError, errorTitle, errorText }
}
