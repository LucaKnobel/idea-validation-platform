import { createAuthClient } from 'better-auth/vue'
import { useLocalePath } from '#imports'
import type { Ref } from 'vue'

export interface UseAuthComposable {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  resendVerificationEmail: (email: string) => Promise<boolean>
  resetError: () => void
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
}

export const useAuth = (): UseAuthComposable => {
  const localePath = useLocalePath()
  const client = createAuthClient()
  const { hasError, errorTitle, errorText, resetError, handleRegistrationError, handleLoginError } = useErrorHandler()

  const login = async (email: string, password: string, rememberMe = true): Promise<boolean> => {
    resetError()

    try {
      const { error } = await client.signIn.email({
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
      const { error } = await client.signUp.email({
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
      const { error } = await client.sendVerificationEmail({
        email,
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

  return { login, register, resendVerificationEmail, resetError, hasError, errorTitle, errorText }
}
