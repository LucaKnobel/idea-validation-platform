<script setup lang="ts">
const open = defineModel<boolean>('open', {
  default: false
})

const { openCheckout } = usePayrexxCheckout()
const { showError } = useToastNotification()

const handleUpgrade = async (): Promise<void> => {
  try {
    open.value = false
    await openCheckout()
  } catch {
    showError('settings.subscription.checkout.error.title', 'settings.subscription.checkout.error.message')
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('upgradeToProModal.title')"
    :description="$t('upgradeToProModal.description')"
    :ui="{
      content: 'w-[92vw] sm:max-w-xl',
      body: 'space-y-5',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p class="text-sm text-toned">
          {{ $t('upgradeToProModal.pitch') }}
        </p>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="open = false"
      >
        {{ $t('actions.cancel') }}
      </UButton>

      <UButton
        icon="i-lucide-sparkles"
        color="primary"
        @click="handleUpgrade"
      >
        {{ $t('upgradeToProModal.cta') }}
      </UButton>
    </template>
  </UModal>
</template>
