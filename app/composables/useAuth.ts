import { createAuthClient } from 'better-auth/vue'
import { useLocalePath } from '#imports'
import type { Ref } from 'vue'

export interface UseAuthComposable {
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
  const { hasError, errorTitle, errorText, resetError, handleRegistrationError } = useErrorHandler()

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
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
  }

  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    const { error } = await client.sendVerificationEmail({
      email,
      callbackURL: localePath('/auth/login')
    })

    if (error) {
      handleRegistrationError(error)
      return false
    }

    return true
  }

  return { register, resendVerificationEmail, resetError, hasError, errorTitle, errorText }
}
