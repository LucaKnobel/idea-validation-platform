<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { VerifyEmailForm } from '~/types/authForms'

definePageMeta({
  layout: 'auth'
})

const { resendVerificationEmail, hasError, errorTitle, errorText, resetError } = useAuth()
const { createVerifyEmailSchema } = useValidation()
const { showSuccess } = useToastNotification()
const { isSubmitting: isResending, runWithSubmitGuard } = useAsyncSubmitGuard()

const pendingEmail = useState('pendingVerifyEmail', () => '')
const schema = createVerifyEmailSchema()
const formState = reactive<VerifyEmailForm>({
  email: pendingEmail.value
})

const onResend = async (event: FormSubmitEvent<VerifyEmailForm>): Promise<void> => {
  await runWithSubmitGuard(async () => {
    resetError()
    const ok = await resendVerificationEmail(event.data.email)
    if (ok) {
      formState.email = event.data.email
      pendingEmail.value = '' // Clear after successful resend
      showSuccess('auth.verifyEmail.resend.success.title', 'auth.verifyEmail.resend.success.message')
    }
  })
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center py-8">
    <UIcon
      name="i-lucide-mail-check"
      class="text-primary size-16"
    />
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">
        {{ $t('auth.verifyEmail.title') }}
      </h1>
      <p class="text-muted text-sm max-w-sm">
        {{ $t('auth.verifyEmail.message') }}
      </p>
      <p class="text-muted text-xs max-w-sm">
        {{ $t('auth.verifyEmail.alreadyVerifiedHint') }}
      </p>
    </div>

    <UForm
      :schema="schema"
      :state="formState"
      class="w-full max-w-sm space-y-4 text-left"
      @submit="onResend"
    >
      <UFormField
        name="email"
        :label="$t('form.email.label')"
      >
        <UInput
          v-model="formState.email"
          type="email"
          :placeholder="$t('form.email.placeholder')"
          required
          class="w-full"
        />
      </UFormField>

      <UAlert
        v-if="hasError"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorTitle"
        :description="errorText"
      />

      <UButton
        type="submit"
        color="primary"
        variant="soft"
        :loading="isResending"
        block
      >
        {{ $t('auth.verifyEmail.resend.action') }}
      </UButton>
    </UForm>

    <NuxtLinkLocale
      to="/auth/login"
      class="text-primary text-sm font-medium"
    >
      {{ $t('auth.verifyEmail.backToLogin') }}
    </NuxtLinkLocale>
  </div>
</template>
