<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

type HypothesisDetailTab = 'overview' | 'metrics' | 'experiments' | 'evidence'
type HypothesisDimension = CreateHypothesisBodyDto['dimension']
type HypothesisPriority = CreateHypothesisBodyDto['priority']
type HypothesisCanvasSection = CreateHypothesisBodyDto['canvasSectionTypes'][number]

const { t } = useI18n()
const router = useRouter()
const { showSuccess, showError } = useToastNotification()
const { createHypothesisFormSchema } = useValidation()
const {
  ideaId,
  versionId,
  hypothesisId,
  hasIdeaVersionHypothesisRouteParams
} = useIdeaVersionRouteParams()
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

const isUpdating = ref(false)
const isDeleting = ref(false)
const activeTab = ref<HypothesisDetailTab>('overview')

const createEmptyFormState = (): CreateHypothesisBodyDto => {
  return {
    statement: '',
    dimension: 'PROBLEM',
    priority: 'MEDIUM',
    canvasSectionTypes: []
  }
}

const formSchema = createHypothesisFormSchema()

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

const tabs = computed<Array<{ key: HypothesisDetailTab, label: string }>>(() => {
  return [
    { key: 'overview', label: t('ideaWorkspace.hypotheses.detail.tabs.overview') },
    { key: 'metrics', label: t('ideaWorkspace.hypotheses.detail.tabs.metrics') },
    { key: 'experiments', label: t('ideaWorkspace.hypotheses.detail.tabs.experiments') },
    { key: 'evidence', label: t('ideaWorkspace.hypotheses.detail.tabs.evidence') }
  ]
})

const dimensionOptions = computed<Array<{ label: string, value: HypothesisDimension }>>(() => {
  return [
    { label: t('ideaWorkspace.hypotheses.dimensions.PROBLEM'), value: 'PROBLEM' },
    { label: t('ideaWorkspace.hypotheses.dimensions.SOLUTION'), value: 'SOLUTION' },
    { label: t('ideaWorkspace.hypotheses.dimensions.MARKET'), value: 'MARKET' },
    { label: t('ideaWorkspace.hypotheses.dimensions.MONETIZATION'), value: 'MONETIZATION' },
    { label: t('ideaWorkspace.hypotheses.dimensions.EXECUTION'), value: 'EXECUTION' }
  ]
})

const priorityOptions = computed<Array<{ label: string, value: HypothesisPriority }>>(() => {
  return [
    { label: t('ideaWorkspace.hypotheses.priorities.HIGH'), value: 'HIGH' },
    { label: t('ideaWorkspace.hypotheses.priorities.MEDIUM'), value: 'MEDIUM' },
    { label: t('ideaWorkspace.hypotheses.priorities.LOW'), value: 'LOW' }
  ]
})

const sectionOptions = computed<Array<{ label: string, value: HypothesisCanvasSection }>>(() => {
  return [
    { label: t('ideaWorkspace.canvasPage.sections.KEY_PARTNERS'), value: 'KEY_PARTNERS' },
    { label: t('ideaWorkspace.canvasPage.sections.KEY_ACTIVITIES'), value: 'KEY_ACTIVITIES' },
    { label: t('ideaWorkspace.canvasPage.sections.VALUE_PROPOSITIONS'), value: 'VALUE_PROPOSITIONS' },
    { label: t('ideaWorkspace.canvasPage.sections.CUSTOMER_RELATIONSHIPS'), value: 'CUSTOMER_RELATIONSHIPS' },
    { label: t('ideaWorkspace.canvasPage.sections.CUSTOMER_SEGMENTS'), value: 'CUSTOMER_SEGMENTS' },
    { label: t('ideaWorkspace.canvasPage.sections.KEY_RESOURCES'), value: 'KEY_RESOURCES' },
    { label: t('ideaWorkspace.canvasPage.sections.CHANNELS'), value: 'CHANNELS' },
    { label: t('ideaWorkspace.canvasPage.sections.COST_STRUCTURE'), value: 'COST_STRUCTURE' },
    { label: t('ideaWorkspace.canvasPage.sections.REVENUE_STREAMS'), value: 'REVENUE_STREAMS' }
  ]
})

const hasValidRouteParams = computed(() => {
  return hasIdeaVersionHypothesisRouteParams.value
})

const statusLabel = computed(() => t('ideaWorkspace.hypotheses.status.OPEN'))

const priorityColor = computed(() => {
  if (hypothesis.value?.priority === 'HIGH') {
    return 'error'
  }

  if (hypothesis.value?.priority === 'MEDIUM') {
    return 'warning'
  }

  return 'neutral'
})

const listRoute = computed(() => {
  return `/ideas/${ideaId.value}/versions/${versionId.value}/hypotheses`
})

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

const openEditModal = (): void => {
  if (hypothesis.value === null) {
    return
  }

  openUpdateModal(hypothesis.value)
}

const openDeleteConfirmation = (): void => {
  if (hypothesis.value === null) {
    return
  }

  openDeleteModal(hypothesis.value)
}

const onUpdateSubmit = async (data: CreateHypothesisBodyDto): Promise<void> => {
  if (!hasValidRouteParams.value || formHypothesisId.value === null) {
    return
  }

  isUpdating.value = true

  try {
    const updated = await updateHypothesisRequest({
      ideaId: ideaId.value,
      versionId: versionId.value,
      hypothesisId: formHypothesisId.value,
      body: data
    })

    hypothesis.value = updated
    showSuccess('ideaWorkspace.hypotheses.success.update.title', 'ideaWorkspace.hypotheses.success.update.message')
    closeUpdateModal()
  } catch (error: unknown) {
    if (handleRateLimitError(error)) {
      return
    }

    showError('ideaWorkspace.hypotheses.error.update.title', 'ideaWorkspace.hypotheses.error.update.message')
  } finally {
    isUpdating.value = false
  }
}

const confirmDeleteHypothesis = async (): Promise<void> => {
  if (!hasValidRouteParams.value || deleteCandidate.value === null) {
    return
  }

  isDeleting.value = true

  try {
    await deleteHypothesisRequest({
      ideaId: ideaId.value,
      versionId: versionId.value,
      hypothesisId: deleteCandidate.value.id
    })

    showSuccess('ideaWorkspace.hypotheses.success.delete.title', 'ideaWorkspace.hypotheses.success.delete.message')
    closeDeleteModal()
    await navigateTo(listRoute.value, { replace: true })
  } catch (error: unknown) {
    if (handleRateLimitError(error)) {
      return
    }

    showError('ideaWorkspace.hypotheses.error.delete.title', 'ideaWorkspace.hypotheses.error.delete.message')
  } finally {
    isDeleting.value = false
  }
}

watch([ideaId, versionId, hypothesisId], async () => {
  await loadHypothesisForRoute()
}, {
  immediate: true
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.hypotheses.detail.title')"
      :description="$t('ideaWorkspace.hypotheses.detail.description')"
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

    <UCard>
      <template #header>
        <div class="flex flex-wrap items-start gap-3">
          <div class="min-w-0 flex-1 space-y-2">
            <USkeleton
              v-if="isLoading"
              class="h-7 w-2/3"
            />

            <h2
              v-else
              class="text-xl leading-7 font-semibold text-highlighted"
            >
              {{ hypothesis?.statement || '-' }}
            </h2>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                color="neutral"
                variant="soft"
              >
                {{ hypothesis ? $t(`ideaWorkspace.hypotheses.dimensions.${hypothesis.dimension}`) : '-' }}
              </UBadge>

              <UBadge
                :color="priorityColor"
                variant="soft"
              >
                {{ hypothesis ? $t(`ideaWorkspace.hypotheses.priorities.${hypothesis.priority}`) : '-' }}
              </UBadge>

              <UBadge
                color="neutral"
                variant="soft"
              >
                {{ statusLabel }}
              </UBadge>
            </div>
          </div>

          <div class="ms-auto flex flex-wrap items-center gap-2">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-arrow-left"
              @click="router.push(listRoute)"
            >
              {{ $t('ideaWorkspace.hypotheses.detail.actions.backToList') }}
            </UButton>

            <UButton
              color="primary"
              variant="soft"
              icon="i-lucide-pencil"
              :disabled="isLoading || hypothesis === null"
              @click="openEditModal"
            >
              {{ $t('actions.edit') }}
            </UButton>

            <UButton
              color="error"
              variant="soft"
              icon="i-lucide-trash-2"
              :disabled="isLoading || hypothesis === null"
              @click="openDeleteConfirmation"
            >
              {{ $t('actions.delete') }}
            </UButton>
          </div>
        </div>
      </template>

      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="tab in tabs"
            :key="tab.key"
            color="neutral"
            :variant="activeTab === tab.key ? 'solid' : 'soft'"
            size="sm"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </UButton>
        </div>

        <div
          v-if="activeTab === 'overview'"
          class="grid gap-4 lg:grid-cols-2"
        >
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-highlighted">
                {{ $t('ideaWorkspace.hypotheses.detail.overview.generalInformation') }}
              </h3>
            </template>

            <dl class="space-y-3 text-sm">
              <div class="flex items-start justify-between gap-3">
                <dt class="text-muted">
                  {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.statement') }}
                </dt>
                <dd class="max-w-[70%] text-right text-highlighted">
                  {{ hypothesis?.statement || '-' }}
                </dd>
              </div>

              <div class="flex items-start justify-between gap-3">
                <dt class="text-muted">
                  {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.dimension') }}
                </dt>
                <dd class="text-highlighted">
                  {{ hypothesis ? $t(`ideaWorkspace.hypotheses.dimensions.${hypothesis.dimension}`) : '-' }}
                </dd>
              </div>

              <div class="flex items-start justify-between gap-3">
                <dt class="text-muted">
                  {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.priority') }}
                </dt>
                <dd class="text-highlighted">
                  {{ hypothesis ? $t(`ideaWorkspace.hypotheses.priorities.${hypothesis.priority}`) : '-' }}
                </dd>
              </div>

              <div class="flex items-start justify-between gap-3">
                <dt class="text-muted">
                  {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.status') }}
                </dt>
                <dd class="text-highlighted">
                  {{ statusLabel }}
                </dd>
              </div>
            </dl>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold text-highlighted">
                {{ $t('ideaWorkspace.hypotheses.detail.overview.canvasAssignment') }}
              </h3>
            </template>

            <div class="flex flex-wrap gap-2">
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
            </div>
          </UCard>
        </div>

        <UCard v-else-if="activeTab === 'metrics'">
          <p class="text-sm text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.placeholders.metrics') }}
          </p>
        </UCard>

        <UCard v-else-if="activeTab === 'experiments'">
          <p class="text-sm text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.placeholders.experiments') }}
          </p>
        </UCard>

        <UCard v-else>
          <p class="text-sm text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.placeholders.evidence') }}
          </p>
        </UCard>
      </div>
    </UCard>

    <IdeaWorkspaceHypothesisFormModal
      :form-schema="formSchema"
      :initial-state="updateFormState"
      :title="$t('ideaWorkspace.hypotheses.modal.editTitle')"
      :submit-label="$t('ideaWorkspace.hypotheses.actions.update')"
      :open="isUpdateModalOpen"
      :is-submitting="isUpdating"
      :dimension-options="dimensionOptions"
      :priority-options="priorityOptions"
      :section-options="sectionOptions"
      @update:open="isUpdateModalOpen = $event"
      @submit="onUpdateSubmit"
    />

    <IdeaWorkspaceHypothesisDeleteModal
      :open="isDeleteModalOpen"
      :delete-candidate="deleteCandidate"
      :is-submitting="isDeleting"
      @update:open="isDeleteModalOpen = $event"
      @confirm-delete="confirmDeleteHypothesis"
    />
  </div>
</template>
