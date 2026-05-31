<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <UPageHeader
      :title="$t('upgradePage.title')"
      :description="$t('upgradePage.description')"
    />

    <UCard>
      <div class="space-y-4">
        <UBadge
          color="warning"
          variant="subtle"
        >
          {{ $t('upgradePage.wipBadge') }}
        </UBadge>

        <p class="text-sm text-muted">
          {{ $t('upgradePage.wipText') }}
        </p>
      </div>
    </UCard>
  </div>
</template>
