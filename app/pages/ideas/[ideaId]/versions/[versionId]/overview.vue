<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { ideaId, versionId } = useIdeaVersionRouteParams()
</script>

<template>
  <IdeaWorkspacePlaceholderPage
    title="Workspace Overview"
    description="Routing skeleton for the new versioned idea workspace."
    badge-label="Step 1 Placeholder"
    body-text="This page is intentionally static and does not use APIs yet."
    :idea-id="ideaId"
    :version-id="versionId"
  />
</template>
