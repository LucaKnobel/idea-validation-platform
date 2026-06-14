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
  evidenceTypeOptions,
  sectionOptions
} = useHypothesisFormConfig()
const { ideaId, versionId, hasIdeaVersionRouteParams } = useIdeaVersionRouteParams()
const { toHypothesisDetails } = useIdeaWorkspaceLinks()

const {
  hypotheses,
  isLoading,
  isCreating,
  isDeletingId,
  isUpdatingId,
  hasError,
  loadHypotheses: loadHypothesesData,
  createHypothesis: createHypothesisData,
  updateHypothesis: updateHypothesisData,
  deleteHypothesis: deleteHypothesisData
} = useHypotheses()

const formSchema = createHypothesisFormSchema()
const {
  createFormTitle,
  createSubmitLabel,
  createFormState,
  updateFormTitle,
  updateSubmitLabel,
  updateFormState,
  formHypothesisId,
  deleteCandidate,
  isCreateModalOpen,
  isUpdateModalOpen,
  isDeleteModalOpen,
  openCreateModal,
  openUpdateModal,
  openDeleteModal,
  runCreateAction,
  runUpdateAction,
  runDeleteAction
} = useHypothesisModalActions({
  createEmptyFormState
})

/**
 * Navigates from list/table context to the dedicated hypothesis detail page.
 */
const openHypothesisDetails = async (hypothesis: HypothesisResponseDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  const target = toHypothesisDetails(hypothesis.id)

  await navigateTo(target)
}

/**
 * Loads hypotheses for the current route once idea and version identifiers are valid.
 */
const loadHypothesesForRoute = async (): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  await loadHypothesesData({
    ideaId: ideaId.value,
    versionId: versionId.value
  })
}

/**
 * Persists create changes emitted by the create hypothesis form modal.
 */
const onCreateSubmit = async (data: UpsertHypothesisBodyDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  await runCreateAction(async () => {
    const created = await createHypothesisData({
      ideaId: ideaId.value,
      versionId: versionId.value,
      body: data
    })

    return created !== null
  })
}

/**
 * Persists update changes emitted by the update hypothesis form modal.
 */
const onUpdateSubmit = async (data: UpsertHypothesisBodyDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  if (formHypothesisId.value === null) {
    return
  }

  await runUpdateAction(async () => {
    const updated = await updateHypothesisData({
      hypothesisId: formHypothesisId.value || '',
      body: data
    })

    return updated !== null
  })
}

/**
 * Confirms and deletes the currently selected hypothesis from the delete modal.
 */
const confirmDeleteHypothesis = async (): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  if (deleteCandidate.value === null) {
    return
  }

  const hypothesisId = deleteCandidate.value.id

  await runDeleteAction(async () => {
    return await deleteHypothesisData({
      hypothesisId
    })
  })
}

/**
 * Maps form mode + active request states to the primary form submit loading state.
 */
const isCreateFormSubmitting = computed(() => {
  return isCreating.value
})

/**
 * Maps the update modal to the active update request state.
 */
const isUpdateFormSubmitting = computed(() => {
  if (formHypothesisId.value === null) {
    return false
  }

  return isUpdatingId.value === formHypothesisId.value
})

/**
 * Reloads the table data whenever the active idea version route changes.
 */
watch([ideaId, versionId], async () => {
  await loadHypothesesForRoute()
}, {
  immediate: true
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.hypotheses.title')"
      :description="$t('ideaWorkspace.hypotheses.description')"
    />

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
          >
            {{ $t('ideaWorkspace.hypotheses.count', { count: hypotheses.length }) }}
          </UBadge>

          <div class="ms-auto">
            <UButton
              color="primary"
              icon="i-lucide-plus"
              :disabled="!hasIdeaVersionRouteParams"
              @click="openCreateModal"
            >
              {{ $t('ideaWorkspace.hypotheses.actions.create') }}
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
        :title="$t('ideaWorkspace.hypotheses.error.load.title')"
        :description="$t('ideaWorkspace.hypotheses.error.load.message')"
      />

      <IdeaWorkspaceHypothesesTable
        :hypotheses="hypotheses"
        :is-loading="isLoading"
        :is-deleting-id="isDeletingId"
        @create="openCreateModal"
        @edit="openUpdateModal"
        @delete="openDeleteModal"
        @open-details="openHypothesisDetails"
      />
    </UCard>

    <IdeaWorkspaceHypothesisFormModal
      :form-schema="formSchema"
      :initial-state="createFormState"
      :title="createFormTitle"
      :submit-label="createSubmitLabel"
      :open="isCreateModalOpen"
      :is-submitting="isCreateFormSubmitting"
      :dimension-options="dimensionOptions"
      :priority-options="priorityOptions"
      :evidence-type-options="evidenceTypeOptions"
      :section-options="sectionOptions"
      @update:open="isCreateModalOpen = $event"
      @submit="onCreateSubmit"
    />

    <IdeaWorkspaceHypothesisFormModal
      :form-schema="formSchema"
      :initial-state="updateFormState"
      :title="updateFormTitle"
      :submit-label="updateSubmitLabel"
      :open="isUpdateModalOpen"
      :is-submitting="isUpdateFormSubmitting"
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
      :is-submitting="!!isDeletingId"
      @update:open="isDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteHypothesis"
    />
  </div>
</template>
