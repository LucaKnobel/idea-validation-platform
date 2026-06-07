<script setup lang="ts">
/**
 * Props for rendering and managing measurements of one experiment.
 */
interface ExperimentMeasurementsModalProps {
  open: boolean
  experiment: ExperimentResponseDto | null
  measurements: MeasurementResponseDto[]
  isLoading: boolean
  hasError: boolean
  isAnyActionLoading: boolean
  isDeleteSubmitting: boolean
  deletingMeasurementId: string | null
  resolveMetricName: (metricId: string) => string
  formatMeasurementValue: (measurement: MeasurementResponseDto) => string
}

defineProps<ExperimentMeasurementsModalProps>()

const emit = defineEmits<{
  'retry': []
  'create': []
  'edit': [measurement: MeasurementResponseDto]
  'delete': [measurement: MeasurementResponseDto]
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
</script>

<template>
  <UModal
    :open="open"
    :title="t('ideaWorkspace.hypotheses.detail.measurements.title')"
    :description="experiment ? experiment.title : t('ideaWorkspace.hypotheses.detail.measurements.description')"
    :ui="{
      content: 'w-[94vw] sm:max-w-3xl',
      body: 'space-y-5'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="flex flex-wrap items-center gap-2">
        <div class="ms-auto">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :disabled="isAnyActionLoading"
            @click="emit('create')"
          >
            {{ t('ideaWorkspace.hypotheses.detail.measurements.actions.create') }}
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="hasError"
        color="error"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="t('ideaWorkspace.hypotheses.detail.measurements.error.load.title')"
        :description="t('ideaWorkspace.hypotheses.detail.measurements.error.load.message')"
      >
        <template #actions>
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :disabled="isLoading"
            @click="emit('retry')"
          >
            {{ t('ideaWorkspace.hypotheses.detail.actions.retry') }}
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
        v-else-if="measurements.length === 0"
        class="flex min-h-40 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-default px-5 py-8 text-center"
      >
        <div class="space-y-1">
          <p class="font-medium text-highlighted">
            {{ t('ideaWorkspace.hypotheses.detail.measurements.empty.title') }}
          </p>
          <p class="max-w-lg text-sm text-muted">
            {{ t('ideaWorkspace.hypotheses.detail.measurements.empty.description') }}
          </p>
        </div>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <article
          v-for="measurement in measurements"
          :key="measurement.id"
          class="rounded-lg border border-default bg-default p-4"
        >
          <div class="flex flex-wrap items-start gap-3">
            <div class="min-w-0 flex-1 space-y-1">
              <h3 class="text-sm font-semibold text-highlighted">
                {{ resolveMetricName(measurement.metricId) }}
              </h3>
              <p class="text-xs text-muted">
                {{ formatMeasurementValue(measurement) }}
              </p>
              <p
                v-if="measurement.note"
                class="text-xs text-muted"
              >
                {{ measurement.note }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                :disabled="isAnyActionLoading"
                @click="emit('edit', measurement)"
              >
                {{ t('actions.edit') }}
              </UButton>

              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :loading="deletingMeasurementId === measurement.id"
                :disabled="isDeleteSubmitting"
                @click="emit('delete', measurement)"
              >
                {{ t('actions.delete') }}
              </UButton>
            </div>
          </div>
        </article>
      </div>
    </template>
  </UModal>
</template>
