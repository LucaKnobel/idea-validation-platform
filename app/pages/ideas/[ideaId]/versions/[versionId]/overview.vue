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
      title="Workspace Overview"
      description="Routing skeleton for the new versioned idea workspace."
    />

    <UCard>
      <div class="space-y-2">
        <UBadge
          color="warning"
          variant="subtle"
        >
          Step 1 Placeholder
        </UBadge>

        <p class="text-sm text-muted">
          This page is intentionally static and does not use APIs yet.
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
