<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { createHypothesisFormSchema, createMetricFormSchema, createExperimentFormSchema } = useValidation()
const {
  createEmptyFormState,
  dimensionOptions,
  priorityOptions,
  sectionOptions
} = useHypothesisFormConfig()
const {
  ideaId,
  versionId,
  hypothesisId,
  hasIdeaVersionHypothesisRouteParams
} = useIdeaVersionRouteParams()
const { toHypothesesList } = useIdeaWorkspaceLinks()
const {
  hypothesis,
  isLoading,
  hasError,
  loadHypothesis,
  clearHypothesis
} = useHypothesisDetails()
const {
  updateHypothesis: updateHypothesisRequest,
  deleteHypothesis: deleteHypothesisRequest
} = useHypothesesApi()
const { handleRateLimitError } = useErrorHandler()
const {
  statusLabel: getStatusLabel
} = useHypothesesTable()

const formSchema = createHypothesisFormSchema()
const metricFormSchema = createMetricFormSchema()
const experimentFormSchema = createExperimentFormSchema()

const {
  updateFormTitle,
  updateSubmitLabel,
  updateFormState,
  formHypothesisId,
  deleteCandidate,
  isUpdateModalOpen,
  isDeleteModalOpen,
  isUpdateActionSubmitting,
  isDeleteActionSubmitting,
  openEditModal,
  openDeleteConfirmation,
  runUpdateAction,
  runDeleteAction
} = useHypothesisModalActions({
  createEmptyFormState
})

const hasValidRouteParams = computed(() => {
  return hasIdeaVersionHypothesisRouteParams.value
})

const hypothesisStatement = computed(() => {
  if (isLoading.value) {
    return ''
  }

  return hypothesis.value?.statement || '-'
})

const statusLabel = computed(() => getStatusLabel('OPEN'))

const listRoute = computed(() => {
  return toHypothesesList()
})
const {
  metrics,
  isMetricsLoading,
  isMetricDeletingId: metricDeletingId,
  hasMetricsError,
  isMetricModalOpen,
  isMetricDeleteModalOpen,
  metricDeleteCandidate,
  metricFormState,
  metricFormTitle,
  metricSubmitLabel,
  metricOperatorOptions,
  isAnyMetricActionLoading,
  isMetricDeleteSubmitting,
  loadMetricsForRoute,
  clearMetrics,
  openCreateMetricModal,
  openEditMetricModal,
  openMetricDeleteModal,
  formatMetricThreshold,
  submitMetricForm: onMetricSubmit,
  confirmDeleteMetric
} = useHypothesisMetricsDetail({
  ideaId,
  versionId,
  hypothesisId,
  hasValidRouteParams
})
const {
  experiments,
  isExperimentsLoading,
  isExperimentDeletingId: experimentDeletingId,
  hasExperimentsError,
  isExperimentModalOpen,
  isExperimentDeleteModalOpen,
  experimentDeleteCandidate,
  experimentFormState,
  experimentFormTitle,
  experimentSubmitLabel,
  experimentStatusOptions,
  isAnyExperimentActionLoading,
  isExperimentDeleteSubmitting,
  loadExperimentsForRoute: loadExperimentsForRouteFromDetail,
  clearExperiments,
  openCreateExperimentModal,
  openEditExperimentModal,
  openExperimentDeleteModal,
  submitExperimentForm: onExperimentSubmit,
  confirmDeleteExperiment
} = useHypothesisExperimentsDetail({
  ideaId,
  versionId,
  hypothesisId,
  hasValidRouteParams
})

const reloadMetricsForRoute = async (): Promise<void> => {
  await loadMetricsForRoute()
}

const reloadExperimentsForRoute = async (): Promise<void> => {
  await loadExperimentsForRouteFromDetail()
}

const openHypothesisEditModal = (): void => {
  openEditModal(hypothesis.value)
}

const openHypothesisDeleteConfirmation = (): void => {
  openDeleteConfirmation(hypothesis.value)
}

const loadHypothesisForRoute = async (): Promise<void> => {
  if (!hasValidRouteParams.value) {
    clearHypothesis()
    clearMetrics()
    clearExperiments()
    return
  }

  await Promise.all([
    loadHypothesis({
      ideaId: ideaId.value,
      versionId: versionId.value,
      hypothesisId: hypothesisId.value
    }),
    loadMetricsForRoute(),
    loadExperimentsForRouteFromDetail()
  ])
}

const onUpdateSubmit = async (data: CreateHypothesisBodyDto): Promise<void> => {
  if (!hasValidRouteParams.value || formHypothesisId.value === null) {
    return
  }

  try {
    await runUpdateAction(async () => {
      const updated = await updateHypothesisRequest({
        ideaId: ideaId.value,
        versionId: versionId.value,
        hypothesisId: formHypothesisId.value || '',
        body: data
      })

      hypothesis.value = updated
      return true
    })
  } catch (error: unknown) {
    if (handleRateLimitError(error)) {
      return
    }
  }
}

const confirmDeleteHypothesis = async (): Promise<void> => {
  if (!hasValidRouteParams.value || deleteCandidate.value === null) {
    return
  }

  try {
    const deleteHypothesisId = deleteCandidate.value.id

    await runDeleteAction(async () => {
      await deleteHypothesisRequest({
        ideaId: ideaId.value,
        versionId: versionId.value,
        hypothesisId: deleteHypothesisId
      })

      return true
    }, async () => {
      await navigateTo(listRoute.value, { replace: true })
    })
  } catch (error: unknown) {
    if (handleRateLimitError(error)) {
      return
    }
  }
}

watch([ideaId, versionId, hypothesisId], async () => {
  await loadHypothesisForRoute()
}, {
  immediate: true
})
</script>

<template>
  <div class="space-y-6 pb-8">
    <IdeaWorkspaceHypothesisDetailHeaderSection
      :is-loading="isLoading"
      :hypothesis="hypothesis"
      :hypothesis-statement="hypothesisStatement"
      @edit="openHypothesisEditModal"
      @delete="openHypothesisDeleteConfirmation"
    />

    <UAlert
      v-if="!hasValidRouteParams"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.hypotheses.detail.error.invalidParams.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.error.invalidParams.message')"
    />

    <UAlert
      v-else-if="hasError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.hypotheses.detail.error.load.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.error.load.message')"
    >
      <template #actions>
        <UButton
          color="error"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="loadHypothesisForRoute"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.actions.retry') }}
        </UButton>
      </template>
    </UAlert>

    <IdeaWorkspaceHypothesisOverviewSection
      :hypothesis="hypothesis"
      :is-loading="isLoading"
      :status-label="statusLabel"
    />

    <IdeaWorkspaceHypothesisMetricsSection
      :metrics="metrics"
      :is-loading="isMetricsLoading"
      :has-error="hasMetricsError"
      :has-valid-route-params="hasValidRouteParams"
      :is-any-action-loading="isAnyMetricActionLoading"
      :is-metric-delete-submitting="isMetricDeleteSubmitting"
      :metric-deleting-id="metricDeletingId"
      :format-metric-threshold="formatMetricThreshold"
      @retry="reloadMetricsForRoute"
      @create="openCreateMetricModal"
      @edit="openEditMetricModal"
      @delete="openMetricDeleteModal"
    />

    <IdeaWorkspaceHypothesisExperimentsSection
      :experiments="experiments"
      :is-loading="isExperimentsLoading"
      :has-error="hasExperimentsError"
      :has-valid-route-params="hasValidRouteParams"
      :is-any-action-loading="isAnyExperimentActionLoading"
      :is-experiment-delete-submitting="isExperimentDeleteSubmitting"
      :experiment-deleting-id="experimentDeletingId"
      @retry="reloadExperimentsForRoute"
      @create="openCreateExperimentModal"
      @edit="openEditExperimentModal"
      @delete="openExperimentDeleteModal"
    />

    <IdeaWorkspaceHypothesisFormModal
      :form-schema="formSchema"
      :initial-state="updateFormState"
      :title="updateFormTitle"
      :submit-label="updateSubmitLabel"
      :open="isUpdateModalOpen"
      :is-submitting="isUpdateActionSubmitting"
      :dimension-options="dimensionOptions"
      :priority-options="priorityOptions"
      :section-options="sectionOptions"
      @update:open="isUpdateModalOpen = $event"
      @submit="onUpdateSubmit"
    />

    <IdeaWorkspaceHypothesisDeleteModal
      :open="isDeleteModalOpen"
      :delete-candidate="deleteCandidate"
      :is-submitting="isDeleteActionSubmitting"
      @update:open="isDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteHypothesis"
    />

    <IdeaWorkspaceMetricFormModal
      :open="isMetricModalOpen"
      :form-schema="metricFormSchema"
      :initial-state="metricFormState"
      :title="metricFormTitle"
      :submit-label="metricSubmitLabel"
      :is-submitting="isAnyMetricActionLoading"
      :operator-options="metricOperatorOptions"
      @update:open="isMetricModalOpen = $event"
      @submit="onMetricSubmit"
    />

    <IdeaWorkspaceMetricDeleteModal
      :open="isMetricDeleteModalOpen"
      :delete-candidate="metricDeleteCandidate"
      :is-submitting="isMetricDeleteSubmitting"
      @update:open="isMetricDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteMetric"
    />

    <IdeaWorkspaceExperimentFormModal
      :open="isExperimentModalOpen"
      :form-schema="experimentFormSchema"
      :initial-state="experimentFormState"
      :title="experimentFormTitle"
      :submit-label="experimentSubmitLabel"
      :is-submitting="isAnyExperimentActionLoading"
      :status-options="experimentStatusOptions"
      @update:open="isExperimentModalOpen = $event"
      @submit="onExperimentSubmit"
    />

    <IdeaWorkspaceExperimentDeleteModal
      :open="isExperimentDeleteModalOpen"
      :delete-candidate="experimentDeleteCandidate"
      :is-submitting="isExperimentDeleteSubmitting"
      @update:open="isExperimentDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteExperiment"
    />
  </div>
</template>
