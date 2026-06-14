<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const {
  createHypothesisFormSchema,
  createMetricFormSchema,
  createExperimentFormSchema,
  createMeasurementFormSchema
} = useValidation()
const {
  createEmptyFormState,
  dimensionOptions,
  priorityOptions,
  evidenceTypeOptions,
  sectionOptions
} = useHypothesisFormConfig()
const {
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
const measurementFormSchema = createMeasurementFormSchema()

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
  metric,
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
  hypothesisId,
  hasValidRouteParams
})
const {
  experiment,
  measurement,
  isExperimentsLoading,
  isMeasurementsLoading,
  isExperimentDeletingId: experimentDeletingId,
  measurementDeletingId,
  hasExperimentsError,
  isExperimentModalOpen,
  isMeasurementModalOpen,
  isMeasurementDeleteModalOpen,
  isExperimentDeleteModalOpen,
  measurementDeleteCandidate,
  experimentDeleteCandidate,
  experimentFormState,
  measurementFormState,
  experimentFormTitle,
  measurementFormTitle,
  experimentSubmitLabel,
  measurementSubmitLabel,
  experimentStatusOptions,
  isAnyExperimentActionLoading,
  isAnyMeasurementActionLoading,
  isExperimentDeleteSubmitting,
  isMeasurementDeleteSubmitting,
  loadExperimentsForRoute: loadExperimentsForRouteFromDetail,
  clearExperiments,
  openCreateExperimentModal,
  openCreateMeasurementModal,
  openEditMeasurementModal,
  openMeasurementDeleteModal,
  openEditExperimentModal,
  openExperimentDeleteModal,
  submitExperimentForm: onExperimentSubmit,
  submitMeasurementForm,
  confirmDeleteExperiment,
  confirmDeleteMeasurement,
  formatMeasurementValue
} = useHypothesisExperimentsDetail({
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
      hypothesisId: hypothesisId.value
    }),
    loadMetricsForRoute(),
    loadExperimentsForRouteFromDetail()
  ])
}

const onUpdateSubmit = async (data: UpsertHypothesisBodyDto): Promise<void> => {
  if (!hasValidRouteParams.value || formHypothesisId.value === null) {
    return
  }

  try {
    await runUpdateAction(async () => {
      const updated = await updateHypothesisRequest({
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

watch([hypothesisId], async () => {
  await loadHypothesisForRoute()
}, {
  immediate: true
})
</script>

<template>
  <div class="mx-auto w-full max-w-270 space-y-3 pb-4 lg:space-y-2.5 lg:pb-3">
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
      :metric="metric"
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
      :experiment="experiment"
      :measurement="measurement"
      :is-loading="isExperimentsLoading"
      :is-measurement-loading="isMeasurementsLoading"
      :has-error="hasExperimentsError"
      :has-valid-route-params="hasValidRouteParams"
      :is-any-action-loading="isAnyExperimentActionLoading"
      :is-experiment-delete-submitting="isExperimentDeleteSubmitting"
      :is-measurement-delete-submitting="isMeasurementDeleteSubmitting"
      :experiment-deleting-id="experimentDeletingId"
      :measurement-deleting-id="measurementDeletingId"
      :format-measurement-value="formatMeasurementValue"
      @retry="reloadExperimentsForRoute"
      @create="openCreateExperimentModal"
      @create-measurement="openCreateMeasurementModal"
      @edit-measurement="openEditMeasurementModal"
      @delete-measurement="openMeasurementDeleteModal"
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
      :evidence-type-options="evidenceTypeOptions"
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

    <IdeaWorkspaceMeasurementFormModal
      :open="isMeasurementModalOpen"
      :form-schema="measurementFormSchema"
      :initial-state="measurementFormState"
      :title="measurementFormTitle"
      :submit-label="measurementSubmitLabel"
      :is-submitting="isAnyMeasurementActionLoading"
      @update:open="isMeasurementModalOpen = $event"
      @submit="submitMeasurementForm"
    />

    <IdeaWorkspaceMeasurementDeleteModal
      :open="isMeasurementDeleteModalOpen"
      :delete-candidate="measurementDeleteCandidate"
      :is-submitting="isMeasurementDeleteSubmitting"
      @update:open="isMeasurementDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteMeasurement"
    />
  </div>
</template>
