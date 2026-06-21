<script setup lang="ts">
definePageMeta({
  layout: 'default',
  alias: ['/billing/success']
})

const router = useRouter()
const { showSuccess } = useToastNotification()

const handleContinue = async (): Promise<void> => {
  showSuccess('checkoutSuccess.toast.title', 'checkoutSuccess.toast.message')
  await router.push('/')
}

onMounted(() => {
  showSuccess('checkoutSuccess.title', 'checkoutSuccess.subtitle')
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md space-y-8 text-center">
      <!-- Success Icon -->
      <div class="flex justify-center">
        <div class="rounded-full bg-emerald-100 p-6">
          <UIcon
            name="i-lucide-check-circle-2"
            class="h-12 w-12 text-emerald-600"
          />
        </div>
      </div>

      <!-- Heading -->
      <div class="space-y-2">
        <h1 class="text-3xl font-bold tracking-tight">
          {{ $t('checkoutSuccess.title') }}
        </h1>
        <p class="text-lg text-muted">
          {{ $t('checkoutSuccess.subtitle') }}
        </p>
      </div>

      <!-- Confirmation Message -->
      <div class="rounded-lg border border-primary/10 bg-primary/5 p-4">
        <p class="text-sm">
          {{ $t('checkoutSuccess.message') }}
        </p>
      </div>

      <!-- Next Steps -->
      <div class="space-y-3 text-left">
        <h2 class="font-semibold">
          {{ $t('checkoutSuccess.nextSteps') }}
        </h2>
        <ul class="space-y-2 text-sm text-toned">
          <li class="flex items-start gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{{ $t('checkoutSuccess.step1') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{{ $t('checkoutSuccess.step2') }}</span>
          </li>
          <li class="flex items-start gap-3">
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>{{ $t('checkoutSuccess.step3') }}</span>
          </li>
        </ul>
      </div>

      <!-- CTA -->
      <UButton
        size="lg"
        icon="i-lucide-arrow-right"
        trailing
        @click="handleContinue"
      >
        {{ $t('checkoutSuccess.cta') }}
      </UButton>

      <!-- Support Link -->
      <p class="text-sm text-muted">
        {{ $t('checkoutSuccess.support.prefix') }}
        <ULink
          :to="`mailto:support@example.com`"
          class="text-primary hover:underline"
        >
          {{ $t('checkoutSuccess.support.link') }}
        </ULink>
      </p>
    </div>
  </div>
</template>
