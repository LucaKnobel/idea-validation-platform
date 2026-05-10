<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import type { LoginForm } from '~/composables/useValidation'

definePageMeta({
  layout: 'auth',
  middleware: ['guest-middleware']
})

const { createLoginFormSchema } = useValidation()
const { login, hasError, errorTitle, errorText } = useAuth()
const localePath = useLocalePath()
const { showSuccess } = useToastNotification()
const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const schema = createLoginFormSchema()
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
}]

const onSubmit = async (event: FormSubmitEvent<LoginForm>): Promise<void> => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    const success = await login(event.data.email, event.data.password)

    if (success) {
      showSuccess('auth.login.success.title', 'auth.login.success.message')
      await navigateTo(localePath('/dashboard'))
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (route.query.reset === 'success') {
    showSuccess('auth.resetPassword.success.title', 'auth.resetPassword.success.message')

    await router.replace({
      path: route.path,
      query: {}
    })
  }
})
</script>

<template>
  <UAuthForm
    :schema="schema"
    :fields="fields"
    :title="$t('auth.login.title')"
    :submit="{
      label: $t('auth.login.submit'),
      color: 'primary',
      loading: isSubmitting
    }"
    @submit="onSubmit"
  >
    <template #description>
      {{ $t('auth.login.dontHaveAccount') }} <NuxtLinkLocale
        to="/auth/register"
        class="text-primary font-medium"
      >
        {{ $t('navigation.register') }}
      </NuxtLinkLocale>
    </template>
    <template #password-hint>
      <NuxtLinkLocale
        to="/auth/forgot-password"
        class="text-primary font-medium"
      >
        {{ $t('auth.login.forgotPassword') }}
      </NuxtLinkLocale>
    </template>
    <template #validation>
      <UAlert
        v-if="hasError"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorTitle"
        :description="errorText"
      />
    </template>
    <template #footer>
      {{ $t('auth.login.termsHint') }}
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
