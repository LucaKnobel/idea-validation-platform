<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

export interface ExperimentFormState {
  title: string
  description: string
  status: UpsertExperimentBodyDto['status']
}

interface ExperimentFormStatusOption {
  label: string
  value: UpsertExperimentBodyDto['status']
}

/**
 * Props for experiment create/update modal.
 */
interface ExperimentFormModalProps {
  open: boolean
  formSchema: unknown
  initialState: ExperimentFormState
  title: string
  submitLabel: string
  isSubmitting: boolean
  statusOptions: ExperimentFormStatusOption[]
}

const props = defineProps<ExperimentFormModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', value: ExperimentFormState): void
}>()

const { t } = useI18n()

const editableState = reactive<ExperimentFormState>({
  title: '',
  description: '',
  status: 'PLANNED'
})

const syncFromProps = (source: ExperimentFormState): void => {
  editableState.title = source.title
  editableState.description = source.description
  editableState.status = source.status
}

watch(() => props.initialState, (next) => {
  syncFromProps(next)
}, {
  immediate: true,
  deep: true
})

const closeFormModal = (): void => {
  if (props.isSubmitting) {
    return
  }

  emit('update:open', false)
}

const onSubmit = (event: FormSubmitEvent<unknown>): void => {
  emit('submit', event.data as ExperimentFormState)
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="t('ideaWorkspace.hypotheses.detail.experiments.modal.description')"
    :dismissible="!isSubmitting"
    :ui="{
      content: 'w-[92vw] sm:max-w-2xl',
      body: 'space-y-5'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :schema="formSchema"
        :state="editableState"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          name="title"
          :label="t('ideaWorkspace.hypotheses.detail.experiments.form.title.label')"
          required
        >
          <UInput
            v-model="editableState.title"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.experiments.form.title.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          name="description"
          :label="t('ideaWorkspace.hypotheses.detail.experiments.form.description.label')"
          :description="t('ideaWorkspace.hypotheses.detail.experiments.form.description.description')"
        >
          <UTextarea
            v-model="editableState.description"
            :rows="4"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.experiments.form.description.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          name="status"
          :label="t('ideaWorkspace.hypotheses.detail.experiments.form.status.label')"
          required
        >
          <USelectMenu
            v-model="editableState.status"
            value-key="value"
            :items="statusOptions"
            :search-input="false"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.experiments.form.status.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <div class="border-t border-default pt-4">
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isSubmitting"
              @click="closeFormModal"
            >
              {{ t('actions.cancel') }}
            </UButton>

            <UButton
              type="submit"
              color="primary"
              :loading="isSubmitting"
            >
              {{ submitLabel }}
            </UButton>
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
