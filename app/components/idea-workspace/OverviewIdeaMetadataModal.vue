<script setup lang="ts">
import type { IdeaMetadataForm } from '~/composables/useIdeaOverviewMetadata'

interface OverviewIdeaMetadataModalProps {
  isSubmitting: boolean
  schema: unknown
}

const open = defineModel<boolean>('open', {
  default: false
})

const state = defineModel<IdeaMetadataForm>('state', {
  required: true
})

defineProps<OverviewIdeaMetadataModalProps>()

const emit = defineEmits<{
  submit: [form: IdeaMetadataForm]
}>()

const { t } = useI18n()

/**
 * Emits current form state, while mutation logic stays in the parent composable.
 */
const onSubmit = (): void => {
  emit('submit', state.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('ideaWorkspace.overview.metadata.editModal.title')"
    :dismissible="!isSubmitting"
    :ui="{
      content: 'w-[92vw] sm:max-w-2xl md:min-w-[44rem]',
      body: 'space-y-6'
    }"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-5"
        @submit="onSubmit"
      >
        <UFormField
          name="title"
          :label="t('ideaWorkspace.overview.metadata.fields.title.label')"
          :description="t('ideaWorkspace.overview.metadata.fields.title.description')"
          required
        >
          <UInput
            v-model="state.title"
            :placeholder="t('ideaWorkspace.overview.metadata.fields.title.placeholder')"
            :disabled="isSubmitting"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="description"
          :label="t('ideaWorkspace.overview.metadata.fields.description.label')"
          :description="t('ideaWorkspace.overview.metadata.fields.description.description')"
        >
          <UTextarea
            v-model="state.description"
            :placeholder="t('ideaWorkspace.overview.metadata.fields.description.placeholder')"
            :disabled="isSubmitting"
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isSubmitting"
            @click="open = false"
          >
            {{ t('actions.cancel') }}
          </UButton>

          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            :loading="isSubmitting"
          >
            {{ t('actions.save') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
