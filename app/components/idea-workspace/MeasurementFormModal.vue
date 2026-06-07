<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

export interface MeasurementFormState {
  metricId: string
  value: number
  note: string
}

interface MeasurementMetricOption {
  label: string
  value: string
}

/**
 * Props for measurement create/update modal.
 */
interface MeasurementFormModalProps {
  open: boolean
  formSchema: unknown
  initialState: MeasurementFormState
  title: string
  submitLabel: string
  isSubmitting: boolean
  metricOptions: MeasurementMetricOption[]
}

const props = defineProps<MeasurementFormModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', value: MeasurementFormState): void
}>()

const { t } = useI18n()

const editableState = reactive<MeasurementFormState>({
  metricId: '',
  value: 0,
  note: ''
})

const syncFromProps = (source: MeasurementFormState): void => {
  editableState.metricId = source.metricId
  editableState.value = source.value
  editableState.note = source.note
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
  emit('submit', event.data as MeasurementFormState)
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="t('ideaWorkspace.hypotheses.detail.measurements.modal.description')"
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
          name="metricId"
          :label="t('ideaWorkspace.hypotheses.detail.measurements.form.metric.label')"
          required
        >
          <USelectMenu
            v-model="editableState.metricId"
            value-key="value"
            :items="metricOptions"
            :search-input="false"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.measurements.form.metric.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          name="value"
          :label="t('ideaWorkspace.hypotheses.detail.measurements.form.value.label')"
          required
        >
          <UInput
            v-model="editableState.value"
            type="number"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.measurements.form.value.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          name="note"
          :label="t('ideaWorkspace.hypotheses.detail.measurements.form.note.label')"
        >
          <UTextarea
            v-model="editableState.note"
            :rows="3"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.measurements.form.note.placeholder')"
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
