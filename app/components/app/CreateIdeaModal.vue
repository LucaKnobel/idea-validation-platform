<script setup lang="ts">
interface CreateIdeaModalProps {
  isCreatingIdea: boolean
  schema: unknown
}

const open = defineModel<boolean>('open', {
  default: false
})

const state = defineModel<CreateIdeaForm>('state', {
  required: true
})

defineProps<CreateIdeaModalProps>()

const emit = defineEmits<{
  submit: [form: CreateIdeaForm]
}>()

const { t } = useI18n()

const onSubmit = (): void => {
  emit('submit', state.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('dashboard.createForm.title')"
    :dismissible="!isCreatingIdea"
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
          :label="t('dashboard.createForm.fields.title.label')"
          :description="t('dashboard.createForm.fields.title.description')"
          required
        >
          <UInput
            v-model="state.title"
            :placeholder="t('dashboard.createForm.fields.title.placeholder')"
            :disabled="isCreatingIdea"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="description"
          :label="t('dashboard.createForm.fields.description.label')"
          :description="t('dashboard.createForm.fields.description.description')"
        >
          <UTextarea
            v-model="state.description"
            :placeholder="t('dashboard.createForm.fields.description.placeholder')"
            :disabled="isCreatingIdea"
            :rows="4"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCreatingIdea"
            @click="open = false"
          >
            {{ t('actions.cancel') }}
          </UButton>

          <UButton
            type="submit"
            color="primary"
            :loading="isCreatingIdea"
          >
            {{ t('dashboard.createIdea') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
