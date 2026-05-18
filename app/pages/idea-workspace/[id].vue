<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})

const route = useRoute()
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.title')"
      :description="$t('ideaWorkspace.description')"
    />

    <UCard>
      <div class="space-y-3">
        <UBadge
          color="warning"
          variant="subtle"
        >
          {{ $t('ideaWorkspace.wipBadge') }}
        </UBadge>

        <p class="text-sm text-muted">
          {{ $t('ideaWorkspace.wipText') }}
        </p>

        <p class="text-xs text-toned">
          Idea ID: {{ route.params.id || '-' }}
        </p>
      </div>
    </UCard>
  </div>
</template>
