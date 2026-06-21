<script setup lang="ts">
definePageMeta({
  layout: 'app',
  middleware: ['auth-middleware']
})

const localePath = useLocalePath()

const handleContinue = async (): Promise<void> => {
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
              <div class="rounded-full bg-emerald-100 p-4">
                <UIcon
                  name="i-lucide-check-circle-2"
                  class="h-10 w-10 text-emerald-600"
                />
              </div>
            </div>

            <h1 class="text-2xl font-semibold tracking-tight">
              {{ $t('checkoutSuccess.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ $t('checkoutSuccess.subtitle') }}
            </p>
          </div>
        </template>

        <p class="text-center text-sm text-toned">
          {{ $t('checkoutSuccess.message') }}
        </p>

        <template #footer>
          <div class="flex justify-center">
            <UButton
              size="sm"
              icon="i-lucide-arrow-right"
              trailing
              @click="handleContinue"
            >
              {{ $t('checkoutSuccess.cta') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
