<script setup lang="ts">
/**
 * Props for experiment delete confirmation modal.
 */
interface ExperimentDeleteModalProps {
  open: boolean
  deleteCandidate: ExperimentResponseDto | null
  isSubmitting: boolean
}

const props = defineProps<ExperimentDeleteModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'confirmDelete'): void
}>()

const closeDeleteModal = (): void => {
  if (props.isSubmitting) {
    return
  }

  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="$t('ideaWorkspace.hypotheses.detail.experiments.deleteModal.title')"
    :description="$t('ideaWorkspace.hypotheses.detail.experiments.deleteModal.description')"
    :dismissible="!isSubmitting"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :description="$t('ideaWorkspace.hypotheses.detail.experiments.deleteModal.warning')"
        />

        <div
          v-if="deleteCandidate"
          class="rounded-lg border border-default p-3"
        >
          <p class="text-sm font-medium text-highlighted">
            {{ deleteCandidate.title }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="isSubmitting"
          @click="closeDeleteModal"
        >
          {{ $t('actions.cancel') }}
        </UButton>

        <UButton
          color="error"
          icon="i-lucide-trash-2"
          :loading="isSubmitting"
          @click="emit('confirmDelete')"
        >
          {{ $t('ideaWorkspace.hypotheses.detail.experiments.actions.deleteConfirm') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
