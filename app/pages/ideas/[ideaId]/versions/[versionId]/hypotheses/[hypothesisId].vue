<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { createHypothesisFormSchema } = useValidation()
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
  priorityColor: getPriorityColor,
  statusLabel: getStatusLabel
} = useHypothesesTable()

const formSchema = createHypothesisFormSchema()

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

const priorityColor = computed(() => {
  return getPriorityColor(hypothesis.value?.priority || 'LOW')
})

const listRoute = computed(() => {
  return toHypothesesList()
})

const openHypothesisEditModal = (): void => {
  openEditModal(hypothesis.value)
}

const openHypothesisDeleteConfirmation = (): void => {
  openDeleteConfirmation(hypothesis.value)
}

const loadHypothesisForRoute = async (): Promise<void> => {
  if (!hasValidRouteParams.value) {
    clearHypothesis()
    return
  }

  await loadHypothesis({
    ideaId: ideaId.value,
    versionId: versionId.value,
    hypothesisId: hypothesisId.value
  })
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
    <UPageHeader
      :title="$t('ideaWorkspace.hypotheses.detail.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.description')"
    />

    <div class="flex flex-col gap-4 rounded-xl border border-default bg-default p-4 md:flex-row md:items-start md:justify-between">
      <div class="min-w-0 flex-1 space-y-2">
        <USkeleton
          v-if="isLoading"
          class="h-8 w-full max-w-2xl"
        />

        <h1
          v-else
          class="text-2xl leading-8 font-semibold text-highlighted md:text-3xl"
        >
          {{ hypothesisStatement }}
        </h1>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <UButton
          color="primary"
          variant="soft"
          icon="i-lucide-pencil"
          :disabled="isLoading || hypothesis === null"
          @click="openHypothesisEditModal"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.actions.edit') }}
        </UButton>

        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          :disabled="isLoading || hypothesis === null"
          @click="openHypothesisDeleteConfirmation"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.actions.delete') }}
        </UButton>
      </div>
    </div>

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

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.overview.title') }}
        </h2>
      </template>

      <dl class="space-y-4 text-sm">
        <div class="grid grid-cols-1 gap-3 md:flex md:flex-wrap md:items-start md:gap-4">
          <div class="grid gap-1">
            <dt class="font-medium text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.status') }}
            </dt>
            <dd>
              <UBadge
                color="neutral"
                variant="soft"
              >
                {{ statusLabel }}
              </UBadge>
            </dd>
          </div>

          <div class="grid gap-1">
            <dt class="font-medium text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.dimension') }}
            </dt>
            <dd>
              <UBadge
                color="neutral"
                variant="soft"
              >
                {{ hypothesis ? $t(`ideaWorkspace.hypotheses.dimensions.${hypothesis.dimension}`) : '-' }}
              </UBadge>
            </dd>
          </div>

          <div class="grid gap-1">
            <dt class="font-medium text-muted">
              {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.priority') }}
            </dt>
            <dd>
              <UBadge
                :color="priorityColor"
                variant="soft"
              >
                {{ hypothesis ? $t(`ideaWorkspace.hypotheses.priorities.${hypothesis.priority}`) : '-' }}
              </UBadge>
            </dd>
          </div>
        </div>

        <div class="grid gap-2">
          <dt class="font-medium text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.canvasAssignments') }}
          </dt>

          <dd class="flex flex-wrap gap-2">
            <UBadge
              v-for="section in hypothesis?.canvasSectionLinks || []"
              :key="section.id"
              color="neutral"
              variant="soft"
            >
              {{ $t(`ideaWorkspace.canvasPage.sections.${section.canvasElementType}`) }}
            </UBadge>

            <p
              v-if="(hypothesis?.canvasSectionLinks.length || 0) === 0"
              class="text-sm text-muted"
            >
              {{ $t('ideaWorkspace.hypotheses.detail.overview.canvasEmpty') }}
            </p>
          </dd>
        </div>
      </dl>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.metrics.title') }}
        </h2>
      </template>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.title') }}
        </h2>
      </template>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-base font-semibold text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.evidence.title') }}
        </h2>
      </template>
    </UCard>

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
  </div>
</template>
