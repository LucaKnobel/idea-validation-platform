import { createAuthClient } from 'better-auth/vue'
import type { Ref } from 'vue'

export interface UseAuthComposable {
  register: (email: string, password: string, name: string) => Promise<void>
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
}

export const useAuth = (): UseAuthComposable => {
  const client = createAuthClient()
  const { hasError, errorTitle, errorText, handleRegistrationError } = useErrorHandler()
  const { showSuccess } = useToastNotification()

  const register = async (email: string, password: string, name: string): Promise<void> => {
    const { error } = await client.signUp.email({
      email,
      password,
      name,
      callbackURL: '/dashboard'
    })

    if (error) {
      handleRegistrationError(error)
      return
    }

    showSuccess('auth.register.success.title', 'auth.register.success.message')
  }

  return { register, hasError, errorTitle, errorText }
}
