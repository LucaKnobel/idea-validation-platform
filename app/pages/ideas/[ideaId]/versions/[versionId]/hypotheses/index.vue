<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const { t } = useI18n()
const localePath = useLocalePath()
const { showSuccess, showError } = useToastNotification()
const { createHypothesisFormSchema } = useValidation()
const {
  createEmptyFormState,
  dimensionOptions,
  priorityOptions,
  sectionOptions
} = useHypothesisFormConfig()
const { ideaId, versionId, hasIdeaVersionRouteParams } = useIdeaVersionRouteParams()

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
  formState: createFormState,
  isCreateModalOpen,
  openCreateModal,
  closeCreateModal
} = useHypothesisCreateModal({
  createEmptyFormState
})
const {
  formState: updateFormState,
  formHypothesisId,
  isUpdateModalOpen,
  openUpdateModal,
  closeUpdateModal
} = useHypothesisUpdateModal({
  createEmptyFormState
})
const {
  deleteCandidate,
  isDeleteModalOpen,
  openDeleteModal,
  closeDeleteModal
} = useHypothesisDeleteModal()

/**
 * Navigates from list/table context to the dedicated hypothesis detail page.
 */
const openHypothesisDetails = async (hypothesis: HypothesisResponseDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  const target = localePath(`/ideas/${ideaId.value}/versions/${versionId.value}/hypotheses/${hypothesis.id}`)

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
const onCreateSubmit = async (data: CreateHypothesisBodyDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }
  const created = await createHypothesisData({
    ideaId: ideaId.value,
    versionId: versionId.value,
    body: data
  })

  if (created === null) {
    showError('ideaWorkspace.hypotheses.error.create.title', 'ideaWorkspace.hypotheses.error.create.message')
    return
  }

  showSuccess('ideaWorkspace.hypotheses.success.create.title', 'ideaWorkspace.hypotheses.success.create.message')
  closeCreateModal()
}

/**
 * Persists update changes emitted by the update hypothesis form modal.
 */
const onUpdateSubmit = async (data: CreateHypothesisBodyDto): Promise<void> => {
  if (!hasIdeaVersionRouteParams.value) {
    return
  }

  if (formHypothesisId.value === null) {
    return
  }

  const updated = await updateHypothesisData({
    ideaId: ideaId.value,
    versionId: versionId.value,
    hypothesisId: formHypothesisId.value,
    body: data
  })

  if (updated === null) {
    showError('ideaWorkspace.hypotheses.error.update.title', 'ideaWorkspace.hypotheses.error.update.message')
    return
  }

  showSuccess('ideaWorkspace.hypotheses.success.update.title', 'ideaWorkspace.hypotheses.success.update.message')
  closeUpdateModal()
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

  const deleted = await deleteHypothesisData({
    ideaId: ideaId.value,
    versionId: versionId.value,
    hypothesisId
  })

  if (!deleted) {
    showError('ideaWorkspace.hypotheses.error.delete.title', 'ideaWorkspace.hypotheses.error.delete.message')
    return
  }

  showSuccess('ideaWorkspace.hypotheses.success.delete.title', 'ideaWorkspace.hypotheses.success.delete.message')
  closeDeleteModal()
}

const formTitle = computed(() => {
  return t('ideaWorkspace.hypotheses.modal.createTitle')
})

const formSubmitLabel = computed(() => {
  return t('ideaWorkspace.hypotheses.actions.create')
})

const updateFormTitle = computed(() => {
  return t('ideaWorkspace.hypotheses.modal.editTitle')
})

const updateFormSubmitLabel = computed(() => {
  return t('ideaWorkspace.hypotheses.actions.update')
})

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
      :title="formTitle"
      :submit-label="formSubmitLabel"
      :open="isCreateModalOpen"
      :is-submitting="isCreateFormSubmitting"
      :dimension-options="dimensionOptions"
      :priority-options="priorityOptions"
      :section-options="sectionOptions"
      @update:open="isCreateModalOpen = $event"
      @submit="onCreateSubmit"
    />

    <IdeaWorkspaceHypothesisFormModal
      :form-schema="formSchema"
      :initial-state="updateFormState"
      :title="updateFormTitle"
      :submit-label="updateFormSubmitLabel"
      :open="isUpdateModalOpen"
      :is-submitting="isUpdateFormSubmitting"
      :dimension-options="dimensionOptions"
      :priority-options="priorityOptions"
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
