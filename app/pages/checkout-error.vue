<script setup lang="ts">
definePageMeta({
  layout: 'default',
  alias: ['/billing/failed']
})

const router = useRouter()
const route = useRoute()
const { showError } = useToastNotification()

const errorCode = computed(() => route.query.code as string | undefined)
type ErrorMessage = { title: string, description: string }

const fallbackError: ErrorMessage = {
  title: 'checkoutCancelled.title',
  description: 'checkoutCancelled.description'
}

const errorMessages: Record<string, ErrorMessage> = {
  cancelled: fallbackError,
  payment_failed: {
    title: 'checkoutFailed.title',
    description: 'checkoutFailed.description'
  },
  declined: {
    title: 'checkoutDeclined.title',
    description: 'checkoutDeclined.description'
  }
}

const currentError = computed<ErrorMessage>(() => {
  const code = errorCode.value || 'cancelled'
  return errorMessages[code] ?? fallbackError
})

const handleRetry = async (): Promise<void> => {
  const { navigateToCheckout } = usePayrexxCheckout()
  navigateToCheckout()
}

const handleGoHome = async (): Promise<void> => {
  await router.push('/')
}

onMounted(() => {
  showError(currentError.value.title, currentError.value.description)
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md space-y-8 text-center">
      <!-- Error Icon -->
      <div class="flex justify-center">
        <div class="rounded-full bg-destructive/10 p-6">
          <UIcon
            name="i-lucide-alert-circle"
            class="h-12 w-12 text-destructive"
          />
        </div>
      </div>

      <!-- Heading -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">
          {{ $t(currentError.title) }}
        </h1>
        <p class="text-lg text-muted">
          {{ $t(currentError.description) }}
        </p>
      </div>

      <!-- Explanation -->
      <div class="rounded-lg border border-destructive/10 bg-destructive/5 p-4">
        <p class="text-sm">
          {{ $t('checkoutError.explanation') }}
        </p>
      </div>

      <!-- Support Info -->
      <div class="space-y-3 text-left">
        <p class="text-sm font-semibold">
          {{ $t('checkoutError.whatNow') }}
        </p>
        <ul class="space-y-2 text-sm text-toned">
          <li class="flex items-start gap-3">
            <UIcon
              name="i-lucide-info"
              class="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{{ $t('checkoutError.step1') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <UIcon
              name="i-lucide-info"
              class="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{{ $t('checkoutError.step2') }}</span>
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="space-y-3">
        <UButton
          size="lg"
          class="w-full"
          @click="handleRetry"
        >
          {{ $t('checkoutError.retryButton') }}
        </UButton>

        <UButton
          size="lg"
          color="neutral"
          variant="ghost"
          class="w-full"
          @click="handleGoHome"
        >
          {{ $t('checkoutError.homeButton') }}
        </UButton>
      </div>

      <!-- Support Link -->
      <p class="text-sm text-muted">
        {{ $t('checkoutError.support.prefix') }}
        <ULink
          :to="`mailto:support@example.com`"
          class="text-primary hover:underline"
        >
          {{ $t('checkoutError.support.link') }}
        </ULink>
      </p>
    </div>
  </div>
</template>
