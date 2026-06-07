<script setup lang="ts">
/**
 * Props for rendering the experiments section of the hypothesis detail page.
 */
interface HypothesisExperimentsSectionProps {
  experiments: ExperimentResponseDto[]
  measurementCountsByExperiment: Record<string, number>
  isLoading: boolean
  hasError: boolean
  hasValidRouteParams: boolean
  isAnyActionLoading: boolean
  isExperimentDeleteSubmitting: boolean
  experimentDeletingId: string | null
}

defineProps<HypothesisExperimentsSectionProps>()

const emit = defineEmits<{
  retry: []
  create: []
  measurements: [experiment: ExperimentResponseDto]
  edit: [experiment: ExperimentResponseDto]
  delete: [experiment: ExperimentResponseDto]
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.title') }}
        </h2>

        <UBadge
          color="neutral"
          variant="subtle"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.count', { count: experiments.length }) }}
        </UBadge>

        <div class="ms-auto">
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :disabled="!hasValidRouteParams"
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
      v-else-if="experiments.length === 0"
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

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="emit('create')"
      >
        {{ $t('ideaWorkspace.hypotheses.detail.experiments.actions.createFirst') }}
      </UButton>
    </div>

    <div
      v-else
      class="space-y-3"
    >
      <article
        v-for="experiment in experiments"
        :key="experiment.id"
        class="rounded-lg border border-default bg-default p-4"
      >
        <div class="flex flex-wrap items-start gap-3">
          <div class="min-w-0 flex-1 space-y-1">
            <h3 class="text-sm font-semibold text-highlighted">
              {{ experiment.title }}
            </h3>
            <p class="text-xs text-muted">
              {{ experiment.description || $t('ideaWorkspace.hypotheses.detail.experiments.noDescription') }}
            </p>
          </div>

          <div class="flex shrink-0 items-center gap-2">
            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-ruler"
              :disabled="isAnyActionLoading"
              @click="emit('measurements', experiment)"
            >
              {{ $t('ideaWorkspace.hypotheses.detail.experiments.actions.measurements') }}
            </UButton>

            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              :disabled="isAnyActionLoading"
              @click="emit('edit', experiment)"
            >
              {{ $t('actions.edit') }}
            </UButton>

            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :loading="experimentDeletingId === experiment.id"
              :disabled="isExperimentDeleteSubmitting"
              @click="emit('delete', experiment)"
            >
              {{ $t('actions.delete') }}
            </UButton>
          </div>
        </div>

        <div class="mt-3 grid gap-2 text-sm md:grid-cols-3">
          <div class="rounded-md bg-elevated px-3 py-2">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.experiments.fields.status') }}
            </p>
            <p class="font-medium text-highlighted">
              {{ $t(`ideaWorkspace.hypotheses.detail.experiments.status.${experiment.status}`) }}
            </p>
          </div>

          <div class="rounded-md bg-elevated px-3 py-2">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.experiments.fields.template') }}
            </p>
            <p class="font-medium text-highlighted break-all">
              {{ experiment.templateId || $t('ideaWorkspace.hypotheses.detail.experiments.noTemplate') }}
            </p>
          </div>

          <div class="rounded-md bg-elevated px-3 py-2">
            <p class="text-xs text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.experiments.fields.measurements') }}
            </p>
            <p class="font-medium text-highlighted">
              {{ measurementCountsByExperiment[experiment.id] ?? 0 }}
            </p>
          </div>
        </div>
      </article>
    </div>
  </UCard>
</template>
