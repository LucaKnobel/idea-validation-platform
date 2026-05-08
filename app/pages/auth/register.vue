<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import type { RegisterForm } from '~/composables/useValidation'

definePageMeta({
  layout: 'auth'
})

const { register, hasError, errorTitle, errorText } = useAuth()
const { createRegisterFormSchema } = useValidation()
const { t } = useI18n()
const localePath = useLocalePath()

const schema = createRegisterFormSchema()
const isSubmitting = ref(false)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: t('form.email.label'),
  placeholder: t('form.email.placeholder'),
  required: true
}, {
  name: 'password',
  label: t('form.password.label'),
  type: 'password',
  placeholder: t('form.password.placeholder'),
  required: true
}, {
  name: 'passwordConfirm',
  label: t('form.password.confirm.label'),
  type: 'password',
  placeholder: t('form.password.confirm.placeholder'),
  required: true
}]

const onSubmit = async (event: FormSubmitEvent<RegisterForm>): Promise<void> => {
  isSubmitting.value = true
  try {
    const ok = await register(event.data.email, event.data.password, '')
    if (ok) {
      useState('pendingVerifyEmail', () => event.data.email).value = event.data.email
      await navigateTo(localePath('/auth/verify-email'))
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UAuthForm
    :schema="schema"
    :fields="fields"
    :title="$t('auth.register.title')"
    :submit="{
      label: $t('auth.register.createAccount'),
      color: 'primary',
      loading: isSubmitting
    }"
    @submit="onSubmit"
  >
    <template #description>
      {{ $t('auth.register.alreadyHaveAccount') }} <NuxtLinkLocale
        to="/auth/login"
        class="text-primary font-medium"
      >
        {{ $t('navigation.login') }}
      </NuxtLinkLocale>
    </template>
    <template #validation>
      <UAlert
        color="info"
        icon="i-lucide-lock"
        :title="$t('validation.password.requirements')"
        :description="$t('validation.password.hint')"
      />
      <UAlert
        v-if="hasError"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorTitle"
        :description="errorText"
      />
    </template>
    <template #footer>
      {{ $t('auth.register.termsHint') }}
      <USeparator class="my-2" />
      <NuxtLinkLocale
        to="/legal/terms-of-service"
        class="text-primary font-medium"
      >
        {{ $t('legal.termsOfService') }}
      </NuxtLinkLocale>
    </template>
  </UAuthForm>
</template>
