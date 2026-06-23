<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { locale } = useI18n()
const dateLocale = computed(() => (locale.value === 'de' ? 'de-DE' : 'en-GB'))

const { ideaId, versionId } = useIdeaVersionRouteParams()
const {
  versions,
  currentVersion,
  timelineItems,
  pending,
  error
} = useIdeaVersionHistory({
  ideaId,
  versionId
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.historyPage.title')"
      :description="$t('ideaWorkspace.historyPage.description')"
    />

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.historyPage.error.title')"
      :description="$t('ideaWorkspace.historyPage.error.message')"
    />

    <UCard
      v-if="pending"
      variant="soft"
    >
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <UCard
          v-for="index in 3"
          :key="`history-loading-${index}`"
        >
          <div class="space-y-3">
            <USkeleton class="h-4 w-24" />
            <USkeleton class="h-6 w-40" />
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-3/4" />
          </div>
        </UCard>
      </div>
    </UCard>

    <UCard v-else-if="versions.length === 0">
      <div class="space-y-2">
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.historyPage.empty.title') }}
        </h2>

        <p class="text-sm text-muted">
          {{ $t('ideaWorkspace.historyPage.empty.description') }}
        </p>
      </div>
    </UCard>

    <UCard
      v-else
      variant="soft"
      class="mx-auto w-full max-w-4xl"
    >
      <UTimeline
        :items="timelineItems"
        orientation="vertical"
        size="md"
      >
        <template #title="{ item }">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-highlighted">
              {{ item.title }}
            </span>
            <UBadge
              v-if="item.value === currentVersion?.id"
              color="primary"
              variant="soft"
              size="xs"
              :label="$t('ideaWorkspace.historyPage.currentBadge')"
            />
          </div>
        </template>

        <template #date="{ item }">
          <div
            v-if="item.date"
            class="text-xs text-muted"
          >
            <NuxtTime
              :datetime="item.date"
              :locale="dateLocale"
              date-style="medium"
              time-style="short"
              :hour12="false"
            />
          </div>
        </template>

        <template #description="{ item }">
          <p class="text-sm text-default">
            {{ item.description }}
          </p>
        </template>
      </UTimeline>
    </UCard>
  </div>
</template>
