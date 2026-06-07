<script setup lang="ts">
/**
 * Props for rendering the metrics section of the hypothesis detail page.
 */
interface HypothesisMetricsSectionProps {
  metrics: MetricResponseDto[]
  isLoading: boolean
  hasError: boolean
  hasValidRouteParams: boolean
  isAnyActionLoading: boolean
  isMetricDeleteSubmitting: boolean
  metricDeletingId: string | null
  formatMetricThreshold: (metric: MetricResponseDto) => string
}

const props = defineProps<HypothesisMetricsSectionProps>()

const emit = defineEmits<{
  retry: []
  create: []
  edit: [metric: MetricResponseDto]
  delete: [metric: MetricResponseDto]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.metrics.title') }}
        </h2>

        <div class="ms-auto">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :disabled="!hasValidRouteParams"
            @click="emit('create')"
          >
            {{ $t('ideaWorkspace.hypotheses.detail.metrics.actions.create') }}
          </UButton>
        </div>
      </div>
    </template>

    <UAlert
      v-if="hasError"
      class="mb-4"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.hypotheses.detail.metrics.error.load.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.metrics.error.load.message')"
    >
      <template #actions>
        <UButton
          color="error"
          variant="outline"
          icon="i-lucide-refresh-cw"
          :disabled="isLoading"
          @click="emit('retry')"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.actions.retry') }}
        </UButton>
      </template>
    </UAlert>

    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <USkeleton class="h-20 w-full" />
      <USkeleton class="h-20 w-full" />
    </div>

    <div
      v-else-if="metrics.length === 0"
      class="flex min-h-44 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-default px-5 py-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
        <UIcon
          name="i-lucide-ruler"
          class="size-6 text-primary"
        />
      </div>

      <div class="space-y-1">
        <p class="font-medium text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.metrics.empty.title') }}
        </p>
        <p class="max-w-lg text-sm text-muted">
          {{ $t('ideaWorkspace.hypotheses.detail.metrics.empty.description') }}
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="emit('create')"
      >
        {{ $t('ideaWorkspace.hypotheses.detail.metrics.actions.createFirst') }}
      </UButton>
    </div>

    <div
      v-else
      class="space-y-2.5"
    >
      <article
        v-for="metric in metrics"
        :key="metric.id"
        class="rounded-lg border border-default bg-default p-3"
      >
        <div class="flex flex-wrap items-start gap-2.5">
          <div class="min-w-0 flex-1 space-y-0.5">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ metric.name }}
            </h3>
            <p class="text-xs text-muted">
              {{ metric.description || $t('ideaWorkspace.hypotheses.detail.metrics.noDescription') }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              :disabled="isAnyActionLoading"
              :aria-label="$t('actions.edit')"
              :title="$t('actions.edit')"
              @click="emit('edit', metric)"
            />

            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :loading="metricDeletingId === metric.id"
              :disabled="isMetricDeleteSubmitting"
              :aria-label="$t('actions.delete')"
              :title="$t('actions.delete')"
              @click="emit('delete', metric)"
            />
          </div>
        </div>

        <div class="mt-2 grid gap-2 text-sm md:grid-cols-1">
          <div class="rounded-md bg-elevated px-3 py-2">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.metrics.fields.threshold') }}
            </p>
            <p class="font-medium text-highlighted">
              {{ props.formatMetricThreshold(metric) }}
            </p>
          </div>
        </div>
      </article>
    </div>
  </UCard>
</template>
