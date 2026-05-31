<script setup lang="ts">
/**
 * Props for hypothesis delete confirmation modal.
 */
interface HypothesisDeleteModalProps {
  open: boolean
  deleteCandidate: HypothesisResponseDto | null
  isSubmitting: boolean
}

defineProps<HypothesisDeleteModalProps>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'confirmDelete'): void
}>()

const { t } = useI18n()

/**
 * Closes the delete modal when there is no active delete request.
 */
const closeDeleteModal = (isSubmitting: boolean): void => {
  if (isSubmitting) {
    return
  }

  emit('update:open', false)
}
</script>

<template>
  <UModal
    :open="open"
    :title="t('ideaWorkspace.hypotheses.deleteModal.title')"
    :description="t('ideaWorkspace.hypotheses.deleteModal.description')"
    :dismissible="!isSubmitting"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :description="t('ideaWorkspace.hypotheses.deleteModal.warning')"
        />

        <div
          v-if="deleteCandidate"
          class="rounded-lg border border-default p-3"
        >
          <p class="line-clamp-3 text-sm font-medium text-highlighted">
            {{ deleteCandidate.statement }}
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
          @click="closeDeleteModal(isSubmitting)"
        >
          {{ t('actions.cancel') }}
        </UButton>

        <UButton
          color="error"
          icon="i-lucide-trash-2"
          :loading="isSubmitting"
          @click="emit('confirmDelete')"
        >
          {{ t('ideaWorkspace.hypotheses.actions.deleteConfirm') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
