<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: ['auth-middleware']
})

const route = useRoute()
const localePath = useLocalePath()

const errorCode = computed(() => route.query.code as string | undefined)
type ErrorMessage = { title: string, description: string }

const fallbackError: ErrorMessage = {
  title: 'checkoutFailed.title',
  description: 'checkoutFailed.description'
}

const errorMessages: Record<string, ErrorMessage> = {
  cancelled: {
    title: 'checkoutFailed.title',
    description: 'checkoutFailed.description'
  },
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
  await navigateToCheckout()
}

const handleGoDashboard = async (): Promise<void> => {
  await navigateTo(localePath('/dashboard'))
}
</script>

<template>
  <UContainer class="py-8 sm:py-10">
    <div class="mx-auto w-full max-w-md">
      <UCard>
        <template #header>
          <div class="space-y-3 text-center">
            <div class="flex justify-center">
              <div class="rounded-full bg-destructive/10 p-4">
                <UIcon
                  name="i-lucide-alert-circle"
                  class="h-10 w-10 text-destructive"
                />
              </div>
            </div>

            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t(currentError.title) }}
            </h1>
            <p class="text-sm text-muted">
              {{ $t(currentError.description) }}
            </p>
          </div>
        </template>

        <p class="text-center text-sm text-toned">
          {{ $t('checkoutError.explanation') }}
        </p>

        <template #footer>
          <div class="flex flex-col items-center gap-2">
            <UButton
              size="sm"
              @click="handleRetry"
            >
              {{ $t('checkoutError.retryButton') }}
            </UButton>

            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleGoDashboard"
            >
              {{ $t('checkoutError.homeButton') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
