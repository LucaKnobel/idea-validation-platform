<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

definePageMeta({
  layout: 'auth'
})

interface VerifyEmailResendForm {
  email: string
}

const route = useRoute()
const { t } = useI18n()
const { resendVerificationEmail, hasError, errorTitle, errorText, resetError } = useAuth()
const { showSuccess } = useToastNotification()

const isResending = ref(false)
const formState = reactive<VerifyEmailResendForm>({
  email: typeof route.query.email === 'string' ? route.query.email : ''
})

const schema = z.object({
  email: z.string().trim().toLowerCase().email(t('validation.email.invalid'))
})

const onResend = async (event: FormSubmitEvent<VerifyEmailResendForm>): Promise<void> => {
  isResending.value = true
  resetError()

  try {
    const ok = await resendVerificationEmail(event.data.email)
    if (ok) {
      formState.email = event.data.email
      showSuccess('auth.verifyEmail.resend.success.title', 'auth.verifyEmail.resend.success.message')
    }
  } finally {
    isResending.value = false
  }
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
