<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

/**
 * Option item rendered in form select menus.
 */
interface SelectOption<TValue> {
  label: string
  value: TValue
}

/**
 * Props for hypothesis create/update modal.
 */
interface HypothesisFormModalProps {
  open: boolean
  formSchema: unknown
  initialState: CreateHypothesisBodyDto
  title: string
  submitLabel: string
  isSubmitting: boolean
  dimensionOptions: Array<SelectOption<CreateHypothesisBodyDto['dimension']>>
  priorityOptions: Array<SelectOption<CreateHypothesisBodyDto['priority']>>
  sectionOptions: Array<SelectOption<CreateHypothesisBodyDto['canvasSectionTypes'][number]>>
}

const props = defineProps<HypothesisFormModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', value: CreateHypothesisBodyDto): void
}>()

const { t } = useI18n()
const isSectionsMenuOpen = ref(false)
const editableState = reactive<CreateHypothesisBodyDto>({
  statement: '',
  dimension: 'PROBLEM',
  priority: 'MEDIUM',
  canvasSectionTypes: []
})

/**
 * Synchronizes local editable state with the parent state snapshot.
 */
const syncFromProps = (source: CreateHypothesisBodyDto): void => {
  editableState.statement = source.statement
  editableState.dimension = source.dimension
  editableState.priority = source.priority
  editableState.canvasSectionTypes = [...source.canvasSectionTypes]
}

watch(() => props.initialState, (next) => {
  syncFromProps(next)
}, {
  immediate: true,
  deep: true
})

/**
 * Keeps the sections select menu close behavior explicit and user-driven.
 */
const confirmSectionSelection = (): void => {
  isSectionsMenuOpen.value = false
}

/**
 * Closes the modal when no submit action is currently running.
 */
const closeFormModal = (): void => {
  if (props.isSubmitting) {
    return
  }

  isSectionsMenuOpen.value = false
  emit('update:open', false)
}

/**
 * Emits validated form data to the page for persistence.
 */
const onSubmit = (event: FormSubmitEvent<unknown>): void => {
  emit('submit', event.data as CreateHypothesisBodyDto)
}
</script>

<template>
  <UModal
    :open="open"
    :title="title"
    :description="t('ideaWorkspace.hypotheses.modal.description')"
    :dismissible="!isSubmitting"
    :ui="{
      content: 'w-[92vw] sm:max-w-3xl',
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
          name="statement"
          :label="t('ideaWorkspace.hypotheses.form.statement.label')"
          :description="t('ideaWorkspace.hypotheses.form.statement.description')"
          required
        >
          <UTextarea
            v-model="editableState.statement"
            :rows="5"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.form.statement.placeholder')"
            :disabled="isSubmitting"
          />
        </UFormField>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField
            name="dimension"
            :label="t('ideaWorkspace.hypotheses.form.dimension.label')"
            required
          >
            <USelectMenu
              v-model="editableState.dimension"
              value-key="value"
              :items="dimensionOptions"
              :search-input="false"
              class="w-full"
              :placeholder="t('ideaWorkspace.hypotheses.form.dimension.placeholder')"
              :disabled="isSubmitting"
            />
          </UFormField>

          <UFormField
            name="priority"
            :label="t('ideaWorkspace.hypotheses.form.priority.label')"
            required
          >
            <USelectMenu
              v-model="editableState.priority"
              value-key="value"
              :items="priorityOptions"
              :search-input="false"
              class="w-full"
              :placeholder="t('ideaWorkspace.hypotheses.form.priority.placeholder')"
              :disabled="isSubmitting"
            />
          </UFormField>
        </div>

        <UFormField
          name="canvasSectionTypes"
          :label="t('ideaWorkspace.hypotheses.form.sections.label')"
          :description="t('ideaWorkspace.hypotheses.form.sections.description')"
          required
        >
          <USelectMenu
            v-model="editableState.canvasSectionTypes"
            v-model:open="isSectionsMenuOpen"
            value-key="value"
            multiple
            clear
            :items="sectionOptions"
            :search-input="{
              placeholder: t('ideaWorkspace.hypotheses.form.sections.searchPlaceholder'),
              icon: 'i-lucide-search'
            }"
            class="w-full"
            :placeholder="t('ideaWorkspace.hypotheses.form.sections.placeholder')"
            :disabled="isSubmitting"
          >
            <template #content-bottom>
              <div class="border-t border-default p-2">
                <UButton
                  block
                  color="primary"
                  size="sm"
                  @click="confirmSectionSelection"
                >
                  {{ t('ideaWorkspace.hypotheses.form.sections.confirm') }}
                </UButton>
              </div>
            </template>
          </USelectMenu>
        </UFormField>

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
      </UForm>
    </template>
  </UModal>
</template>
