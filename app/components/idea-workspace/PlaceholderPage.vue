<script setup lang="ts">
interface IdeaWorkspacePlaceholderPageProps {
  title: string
  description: string
  badgeLabel: string
  bodyText: string
  ideaId: string
  versionId: string
}

defineProps<IdeaWorkspacePlaceholderPageProps>()
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="title"
      :description="description"
    />

    <UCard>
      <div class="space-y-2">
        <UBadge
          color="warning"
          variant="subtle"
        >
          {{ badgeLabel }}
        </UBadge>

        <p class="text-sm text-muted">
          {{ bodyText }}
        </p>

        <p class="text-xs text-toned">
          Idea ID: {{ ideaId || '-' }}
        </p>

        <p class="text-xs text-toned">
          Version ID: {{ versionId || '-' }}
        </p>
      </div>
    </UCard>
  </div>
</template>
