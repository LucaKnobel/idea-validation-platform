<script setup lang="ts">
const open = defineModel<boolean>('open', {
  default: false
})

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('upgradeToProModal.title')"
    :description="t('upgradeToProModal.description')"
    :ui="{
      content: 'w-[92vw] sm:max-w-xl',
      body: 'space-y-5',
      footer: 'justify-end'
    }"
  >
    <template #body>
      <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p class="text-sm text-toned">
          {{ t('upgradeToProModal.pitch') }}
        </p>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="ghost"
        @click="open = false"
      >
        {{ t('actions.cancel') }}
      </UButton>

      <UButton
        icon="i-lucide-sparkles"
        color="primary"
        :to="localePath('/upgrade-to-pro')"
        @click="open = false"
      >
        {{ t('upgradeToProModal.cta') }}
      </UButton>
    </template>
  </UModal>
</template>
