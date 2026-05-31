<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { VerifyEmailForm } from '~/types/authForms'

definePageMeta({
  layout: 'auth',
  middleware: ['guest-middleware']
})

const { requestPasswordReset, hasError, errorTitle, errorText } = useAuth()
const { createVerifyEmailSchema } = useValidation()

const schema = createVerifyEmailSchema()
const isSubmitting = ref(false)
const isSubmitted = ref(false)
const formState = reactive<VerifyEmailForm>({
  email: ''
})

const onSubmit = async (event: FormSubmitEvent<VerifyEmailForm>): Promise<void> => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const ok = await requestPasswordReset(event.data.email)
    if (ok) {
      isSubmitted.value = true
      formState.email = ''
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center py-8">
    <UIcon
      name="i-lucide-mail"
      class="text-primary size-16"
    />
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">
        {{ $t('auth.forgotPassword.title') }}
      </h1>
      <p class="text-muted text-sm max-w-sm">
        {{ $t('auth.forgotPassword.message') }}
      </p>
    </div>

    <div
      v-if="!isSubmitted"
      class="w-full max-w-sm"
    >
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
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
          :loading="isSubmitting"
          block
        >
          {{ $t('auth.forgotPassword.submit') }}
        </UButton>
      </UForm>
    </div>

    <div
      v-else
      class="max-w-sm text-left"
    >
      <UAlert
        color="success"
        icon="i-lucide-check-circle"
        :title="$t('auth.resetPassword.emailSent.title')"
        :description="$t('auth.resetPassword.emailSent.message')"
      />
    </div>

    <NuxtLinkLocale
      to="/auth/login"
      class="text-primary text-sm font-medium"
    >
      {{ $t('auth.forgotPassword.backToLogin') }}
    </NuxtLinkLocale>
  </div>
</template>
