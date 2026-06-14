<script setup lang="ts">
/**
 * Props for rendering the experiment section of the hypothesis detail page.
 */
interface HypothesisExperimentsSectionProps {
  experiment: ExperimentResponseDto | null
  measurement: MeasurementResponseDto | null
  isLoading: boolean
  hasError: boolean
  hasValidRouteParams: boolean
  isAnyActionLoading: boolean
  isMeasurementLoading: boolean
  isExperimentDeleteSubmitting: boolean
  isMeasurementDeleteSubmitting: boolean
  experimentDeletingId: string | null
  measurementDeletingId: string | null
  formatMeasurementValue: (measurement: MeasurementResponseDto) => string
}

defineProps<HypothesisExperimentsSectionProps>()

const emit = defineEmits<{
  retry: []
  create: []
  createMeasurement: []
  editMeasurement: [measurement: MeasurementResponseDto]
  deleteMeasurement: [measurement: MeasurementResponseDto]
  edit: []
  delete: []
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.title') }}
        </h2>

        <div class="ms-auto">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :disabled="!hasValidRouteParams || experiment !== null"
            @click="emit('create')"
          >
            {{ $t('ideaWorkspace.hypotheses.detail.experiments.actions.create') }}
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
      :title="$t('ideaWorkspace.hypotheses.detail.experiments.error.load.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.experiments.error.load.message')"
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
      v-else-if="experiment === null"
      class="flex min-h-44 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-default px-5 py-8 text-center"
    >
      <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
        <UIcon
          name="i-lucide-flask-conical"
          class="size-6 text-primary"
        />
      </div>

      <div class="space-y-1">
        <p class="font-medium text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.empty.title') }}
        </p>
        <p class="max-w-lg text-sm text-muted">
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.empty.description') }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="space-y-2.5"
    >
      <article
        class="rounded-lg border border-default bg-default p-3"
      >
        <div class="flex flex-wrap items-start gap-2.5">
          <div class="min-w-0 flex-1 space-y-0.5">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ experiment.title }}
            </h3>
            <p class="text-xs text-muted">
              {{ experiment.description || $t('ideaWorkspace.hypotheses.detail.experiments.noDescription') }}
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
              @click="emit('edit')"
            />

            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :loading="experimentDeletingId === experiment.id"
              :disabled="isExperimentDeleteSubmitting"
              :aria-label="$t('actions.delete')"
              :title="$t('actions.delete')"
              @click="emit('delete')"
            />
          </div>
        </div>

        <div class="mt-2 space-y-2 text-sm">
          <div class="rounded-md bg-elevated px-3 py-2">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.experiments.fields.status') }}
            </p>
            <p class="font-medium text-highlighted">
              {{ $t(`ideaWorkspace.hypotheses.detail.experiments.status.${experiment.status}`) }}
            </p>
          </div>

          <div class="rounded-md bg-elevated px-3 py-2 space-y-1.5">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.measurements.title') }}
            </p>

            <div
              v-if="isMeasurementLoading"
              class="space-y-2"
            >
              <USkeleton class="h-10 w-full" />
            </div>

            <div
              v-else-if="measurement === null"
              class="space-y-2"
            >
              <p class="text-xs text-muted">
                {{ $t('ideaWorkspace.hypotheses.detail.measurements.empty.title') }}
              </p>

              <UButton
                color="primary"
                variant="soft"
                icon="i-lucide-plus"
                :disabled="isAnyActionLoading"
                @click="emit('createMeasurement')"
              >
                {{ $t('ideaWorkspace.hypotheses.detail.measurements.actions.create') }}
              </UButton>
            </div>

            <div
              v-else
              class="space-y-1.5"
            >
              <article
                class="rounded border border-default bg-default p-2"
              >
                <p class="text-xs text-muted">
                  {{ formatMeasurementValue(measurement) }}
                </p>
                <p
                  v-if="measurement.note"
                  class="text-xs text-muted"
                >
                  {{ measurement.note }}
                </p>

                <div class="mt-2 flex items-center gap-2">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-pencil"
                    :disabled="isAnyActionLoading"
                    :aria-label="$t('ideaWorkspace.hypotheses.detail.measurements.actions.update')"
                    :title="$t('ideaWorkspace.hypotheses.detail.measurements.actions.update')"
                    @click="emit('editMeasurement', measurement)"
                  />

                  <UButton
                    color="error"
                    variant="ghost"
                    icon="i-lucide-trash-2"
                    :loading="measurementDeletingId === measurement.id"
                    :disabled="isMeasurementDeleteSubmitting"
                    :aria-label="$t('actions.delete')"
                    :title="$t('actions.delete')"
                    @click="emit('deleteMeasurement', measurement)"
                  />
                </div>
              </article>
            </div>
          </div>
        </div>
      </article>
    </div>
  </UCard>
</template>
