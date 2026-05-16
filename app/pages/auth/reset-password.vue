<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  middleware: ['guest-middleware']
})

const { resetPassword, hasError, errorTitle, errorText } = useAuth()
const { createPasswordSchema } = useValidation()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()

/**
 * Extracts the reset token from the query string.
 */
const token = computed(() => route.query.token as string)
/**
 * Guards the page against missing or empty reset tokens.
 */
const isValidToken = computed(() => !!token.value)

const schema = createPasswordSchema()
const isSubmitting = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const formState = reactive<PasswordForm>({
  password: '',
  passwordConfirm: ''
})

/**
 * Submits the new password and redirects back to the login page with a success flag.
 */
const onSubmit = async (event: FormSubmitEvent<PasswordForm>): Promise<void> => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const ok = await resetPassword(event.data.password, token.value)
    if (ok) {
      await navigateTo({
        path: localePath('/auth/login'),
        query: { reset: 'success' }
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

/**
 * Redirects users back to the reset request page when the token is missing.
 */
onMounted(() => {
  if (!isValidToken.value) {
    router.push(localePath('/auth/forgot-password'))
  }
})
</script>

<template>
  <div
    v-if="isValidToken"
    class="flex flex-col items-center gap-6 text-center py-8"
  >
    <UIcon
      name="i-lucide-key"
      class="text-primary size-16"
    />
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">
        {{ $t('auth.resetPassword.title') }}
      </h1>
      <p class="text-muted text-sm max-w-sm">
        {{ $t('auth.resetPassword.message') }}
      </p>
    </div>

    <div class="w-full max-w-sm">
      <UForm
        :schema="schema"
        :state="formState"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UAlert
          color="info"
          icon="i-lucide-lock"
          :title="$t('validation.password.requirements')"
          :description="$t('validation.password.hint')"
        />

        <UFormField
          name="password"
          :label="$t('form.password.label')"
        >
          <UInput
            id="reset-password"
            v-model="formState.password"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('form.password.placeholder')"
            :ui="{ trailing: 'pe-1' }"
            required
            class="w-full"
          >
            <template #trailing>
              <UButton
                type="button"
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? $t('form.password.hide') : $t('form.password.show')"
                :aria-pressed="showPassword"
                aria-controls="reset-password"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UFormField
          name="passwordConfirm"
          :label="$t('form.password.confirm.label')"
        >
          <UInput
            id="reset-password-confirm"
            v-model="formState.passwordConfirm"
            :type="showPasswordConfirm ? 'text' : 'password'"
            :placeholder="$t('form.password.confirm.placeholder')"
            :ui="{ trailing: 'pe-1' }"
            required
            class="w-full"
          >
            <template #trailing>
              <UButton
                type="button"
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPasswordConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPasswordConfirm ? $t('form.password.hide') : $t('form.password.show')"
                :aria-pressed="showPasswordConfirm"
                aria-controls="reset-password-confirm"
                @click="showPasswordConfirm = !showPasswordConfirm"
              />
            </template>
          </UInput>
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
          {{ $t('auth.resetPassword.submit') }}
        </UButton>
      </UForm>
    </div>

    <NuxtLinkLocale
      to="/auth/login"
      class="text-primary text-sm font-medium"
    >
      {{ $t('auth.forgotPassword.backToLogin') }}
    </NuxtLinkLocale>
  </div>
</template>

<style>
::-ms-reveal {
  display: none;
}
</style>
