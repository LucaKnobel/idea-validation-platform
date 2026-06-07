<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

export interface MetricFormState {
  name: string
  description: string
  unit: string
  threshold: {
    operator: CreateMetricBodyDto['threshold']['operator']
    referenceValue: number
  }
}

interface MetricFormOperatorOption {
  label: string
  value: CreateMetricBodyDto['threshold']['operator']
}

/**
 * Props for metric create/update modal.
 */
interface MetricFormModalProps {
  open: boolean
  formSchema: unknown
  initialState: MetricFormState
  title: string
  submitLabel: string
  isSubmitting: boolean
  operatorOptions: MetricFormOperatorOption[]
}

const props = defineProps<MetricFormModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', value: MetricFormState): void
}>()

const { t } = useI18n()

const editableState = reactive<MetricFormState>({
  name: '',
  description: '',
  unit: '',
  threshold: {
    operator: 'GTE',
    referenceValue: 0
  }
})

const syncFromProps = (source: MetricFormState): void => {
  editableState.name = source.name
  editableState.description = source.description
  editableState.unit = source.unit
  editableState.threshold = {
    operator: source.threshold.operator,
    referenceValue: source.threshold.referenceValue
  }
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
  emit('submit', event.data as MetricFormState)
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="t('ideaWorkspace.hypotheses.detail.metrics.modal.description')"
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
          name="name"
          :label="t('ideaWorkspace.hypotheses.detail.metrics.form.name.label')"
          required
        >
          <UInput
            v-model="editableState.name"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.metrics.form.name.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          name="description"
          :label="t('ideaWorkspace.hypotheses.detail.metrics.form.description.label')"
          :description="t('ideaWorkspace.hypotheses.detail.metrics.form.description.description')"
        >
          <UTextarea
            v-model="editableState.description"
            :rows="4"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.detail.metrics.form.description.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <UFormField
          :label="t('ideaWorkspace.hypotheses.detail.metrics.form.criterion.label')"
          required
        >
          <div class="grid gap-3 md:grid-cols-[minmax(7rem,9rem)_minmax(0,1fr)_minmax(7rem,9rem)]">
            <UFormField name="threshold.operator">
              <USelectMenu
                v-model="editableState.threshold.operator"
                value-key="value"
                :items="operatorOptions"
                :search-input="false"
                class="w-full"
                :placeholder="t('ideaWorkspace.hypotheses.detail.metrics.form.operator.placeholder')"
                :disabled="isSubmitting"
              />
            </UFormField>

            <UFormField name="threshold.referenceValue">
              <UInput
                v-model="editableState.threshold.referenceValue"
                type="number"
                class="w-full"
                :placeholder="t('ideaWorkspace.hypotheses.detail.metrics.form.referenceValue.placeholder')"
                :disabled="isSubmitting"
              />
            </UFormField>

            <UFormField name="unit">
              <UInput
                v-model="editableState.unit"
                class="w-full"
                :placeholder="t('ideaWorkspace.hypotheses.detail.metrics.form.unit.placeholder')"
                :disabled="isSubmitting"
              />
            </UFormField>
          </div>
          <p class="mt-2 text-xs text-muted">
            {{ t('ideaWorkspace.hypotheses.detail.metrics.form.unit.description') }}
          </p>
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
