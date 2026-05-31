<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const route = useRoute()
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      title="Decision"
      description="Placeholder page for the versioned idea workspace decision view."
    />

    <UCard>
      <div class="space-y-2">
        <UBadge
          color="warning"
          variant="subtle"
        >
          Step 2 Placeholder
        </UBadge>

        <p class="text-sm text-muted">
          This page is static and API integration is intentionally not implemented yet.
        </p>

        <p class="text-xs text-toned">
          Idea ID: {{ route.params.ideaId || '-' }}
        </p>

        <p class="text-xs text-toned">
          Version ID: {{ route.params.versionId || '-' }}
        </p>
      </div>
    </UCard>
  </div>
</template>
