<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { ideaId, versionId } = useIdeaVersionRouteParams()
</script>

<template>
  <IdeaWorkspacePlaceholderPage
    title="Versions"
    description="Placeholder page for the versioned idea workspace versions overview."
    badge-label="Step 2 Placeholder"
    body-text="This page is static and API integration is intentionally not implemented yet."
    :idea-id="ideaId"
    :version-id="versionId"
  />
</template>
