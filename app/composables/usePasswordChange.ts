interface ChangePasswordFormState {
  currentPassword: string
  newPassword: string
  passwordConfirm: string
}

export interface UsePasswordChangeComposable {
  formState: Ref<ChangePasswordFormState>
  formSchema: ComputedRef<unknown>
  isChangingPassword: Ref<boolean>
  hasError: Ref<boolean>
  errorTitle: Ref<string | undefined>
  errorText: Ref<string | undefined>
  submitPasswordChange: () => Promise<void>
}

const createInitialFormState = (): ChangePasswordFormState => ({
  currentPassword: '',
  newPassword: '',
  passwordConfirm: ''
})

/**
 * Handles authenticated password changes for the settings security section.
 */
export const usePasswordChange = (): UsePasswordChangeComposable => {
  const { createChangePasswordSchema } = useValidation()
  const { changePassword, hasError, errorTitle, errorText, resetError } = useAuth()
  const { showSuccess } = useToastNotification()
  const {
    isSubmitting: isChangingPassword,
    runWithSubmitGuard
  } = useAsyncSubmitGuard()

  const formState = ref<ChangePasswordFormState>(createInitialFormState())

  const formSchema = computed(() => createChangePasswordSchema())

  const submitPasswordChange = async (): Promise<void> => {
    resetError()

    const changed = await runWithSubmitGuard(async () => {
      return await changePassword(
        formState.value.currentPassword,
        formState.value.newPassword
      )
    })

    if (!changed) {
      return
    }

    showSuccess('settings.security.success.title', 'settings.security.success.message')
    formState.value = createInitialFormState()
  }

  return {
    formState,
    formSchema,
    isChangingPassword,
    hasError,
    errorTitle,
    errorText,
    submitPasswordChange
  }
}
