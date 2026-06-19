<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { ideaId, versionId } = useIdeaVersionRouteParams()

const {
  validationSummary,
  isLoading,
  hasError,
  loadValidationSummary
} = useIdeaVersionValidation()

const {
  statusItems,
  priorityItems,
  evidenceItems,
  hasSummaryData
} = useValidationOverview({
  validationSummary
})

const loadOverview = async (): Promise<void> => {
  if (!ideaId.value || !versionId.value) {
    return
  }

  await loadValidationSummary({
    ideaId: ideaId.value,
    versionId: versionId.value
  })
}

watch([ideaId, versionId], async () => {
  await loadOverview()
}, {
  immediate: true
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.validationOverview.title')"
      :description="$t('ideaWorkspace.validationOverview.description')"
    />

    <UAlert
      v-if="hasError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.validationOverview.error.load.title')"
      :description="$t('ideaWorkspace.validationOverview.error.load.message')"
    />

    <template v-if="isLoading">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard
          v-for="index in 4"
          :key="`validation-loading-summary-${index}`"
        >
          <div class="space-y-3">
            <USkeleton class="h-4 w-32" />
            <USkeleton class="h-9 w-20" />
            <USkeleton class="h-3 w-28" />
          </div>
        </UCard>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <UCard
          v-for="index in 2"
          :key="`validation-loading-list-${index}`"
        >
          <div class="space-y-3">
            <USkeleton class="h-4 w-40" />
            <USkeleton class="h-6 w-full" />
            <USkeleton class="h-6 w-full" />
            <USkeleton class="h-6 w-full" />
          </div>
        </UCard>
      </div>
    </template>

    <template v-else-if="validationSummary">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UCard>
          <template #header>
            <p class="text-sm font-medium text-muted">
              {{ $t('ideaWorkspace.validationOverview.cards.totalHypotheses') }}
            </p>
          </template>

          <p class="text-3xl font-semibold text-highlighted">
            {{ validationSummary.totalHypotheses }}
          </p>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-sm font-medium text-muted">
              {{ $t('ideaWorkspace.validationOverview.cards.statusDistribution') }}
            </p>
          </template>

          <ul class="space-y-2">
            <li
              v-for="item in statusItems"
              :key="item.key"
              class="flex items-center justify-between gap-3"
            >
              <UBadge
                :label="$t(`ideaWorkspace.validationOverview.status.${item.key}`)"
                :color="item.color"
                variant="subtle"
              />

              <span class="text-sm font-medium text-highlighted">
                {{ item.value }}
              </span>
            </li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-sm font-medium text-muted">
              {{ $t('ideaWorkspace.validationOverview.cards.priorityDistribution') }}
            </p>
          </template>

          <ul class="space-y-2">
            <li
              v-for="item in priorityItems"
              :key="item.key"
              class="flex items-center justify-between gap-3"
            >
              <UBadge
                :label="$t(`ideaWorkspace.validationOverview.priority.${item.key}`)"
                :color="item.color"
                variant="subtle"
              />

              <span class="text-sm font-medium text-highlighted">
                {{ item.value }}
              </span>
            </li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <p class="text-sm font-medium text-muted">
              {{ $t('ideaWorkspace.validationOverview.cards.evidenceDistribution') }}
            </p>
          </template>

          <ul class="space-y-2">
            <li
              v-for="item in evidenceItems"
              :key="item.key"
              class="flex items-center justify-between gap-3"
            >
              <span class="text-sm text-default">
                {{ $t(`ideaWorkspace.validationOverview.evidence.${item.key}`) }}
              </span>

              <span class="text-sm font-medium text-highlighted">
                {{ item.value }}
              </span>
            </li>
          </ul>
        </UCard>
      </div>

      <UCard>
        <template #header>
          <p class="text-sm font-medium text-muted">
            {{ $t('ideaWorkspace.validationOverview.dimensionCards.title') }}
          </p>
        </template>

        <div
          v-if="!hasSummaryData"
          class="rounded-lg border border-dashed border-default px-4 py-6 text-sm text-muted"
        >
          {{ $t('ideaWorkspace.validationOverview.empty.noHypotheses') }}
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          <UCard
            v-for="card in validationSummary.dimensionCards"
            :key="card.dimension"
          >
            <template #header>
              <h3 class="text-sm font-semibold text-highlighted">
                {{ $t(`ideaWorkspace.hypotheses.dimensions.${card.dimension}`) }}
              </h3>
            </template>

            <div class="space-y-4">
              <section class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">
                  {{ $t('ideaWorkspace.validationOverview.cards.statusDistribution') }}
                </p>

                <ul class="space-y-2">
                  <li class="flex items-center justify-between gap-3">
                    <UBadge
                      :label="$t('ideaWorkspace.validationOverview.status.validated')"
                      color="success"
                      variant="subtle"
                    />
                    <span class="text-sm font-medium text-highlighted">{{ card.statusCounts.validated }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <UBadge
                      :label="$t('ideaWorkspace.validationOverview.status.invalidated')"
                      color="error"
                      variant="subtle"
                    />
                    <span class="text-sm font-medium text-highlighted">{{ card.statusCounts.invalidated }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <UBadge
                      :label="$t('ideaWorkspace.validationOverview.status.notTested')"
                      color="neutral"
                      variant="subtle"
                    />
                    <span class="text-sm font-medium text-highlighted">{{ card.statusCounts.notTested }}</span>
                  </li>
                </ul>
              </section>

              <USeparator />

              <section class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">
                  {{ $t('ideaWorkspace.validationOverview.cards.priorityDistribution') }}
                </p>

                <ul class="space-y-2 text-sm">
                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.priority.high') }}</span>
                    <span class="font-medium text-highlighted">{{ card.priorityCounts.high }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.priority.medium') }}</span>
                    <span class="font-medium text-highlighted">{{ card.priorityCounts.medium }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.priority.low') }}</span>
                    <span class="font-medium text-highlighted">{{ card.priorityCounts.low }}</span>
                  </li>
                </ul>
              </section>

              <USeparator />

              <section class="space-y-2">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">
                  {{ $t('ideaWorkspace.validationOverview.cards.evidenceDistribution') }}
                </p>

                <ul class="space-y-2 text-sm">
                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.evidence.qualitative') }}</span>
                    <span class="font-medium text-highlighted">{{ card.evidenceCounts.qualitative }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.evidence.quantitative') }}</span>
                    <span class="font-medium text-highlighted">{{ card.evidenceCounts.quantitative }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.evidence.behavioral') }}</span>
                    <span class="font-medium text-highlighted">{{ card.evidenceCounts.behavioral }}</span>
                  </li>

                  <li class="flex items-center justify-between gap-3">
                    <span class="text-default">{{ $t('ideaWorkspace.validationOverview.evidence.monetary') }}</span>
                    <span class="font-medium text-highlighted">{{ card.evidenceCounts.monetary }}</span>
                  </li>
                </ul>
              </section>
            </div>
          </UCard>
        </div>
      </UCard>
    </template>
  </div>
</template>
