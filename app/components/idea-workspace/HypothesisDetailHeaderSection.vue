<script setup lang="ts">
/**
 * Props for the hypothesis detail header section.
 */
interface HypothesisDetailHeaderSectionProps {
  isLoading: boolean
  hypothesis: HypothesisResponseDto | null
  hypothesisStatement: string
}

defineProps<HypothesisDetailHeaderSectionProps>()

const emit = defineEmits<{
  edit: []
  delete: []
}>()
</script>

<template>
  <UPageHeader
    :title="$t('ideaWorkspace.hypotheses.detail.title')"
    :description="$t('ideaWorkspace.hypotheses.detail.description')"
  />

  <div class="flex flex-col gap-3 rounded-xl border border-default bg-default p-3 md:flex-row md:items-start md:justify-between">
    <div class="min-w-0 flex-1 space-y-1.5">
      <USkeleton
        v-if="isLoading"
        class="h-8 w-full max-w-2xl"
      />

      <h1
        v-else
        class="text-xl leading-7 font-semibold text-highlighted md:text-2xl md:leading-8"
      >
        {{ hypothesisStatement }}
      </h1>
    </div>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <UButton
        color="primary"
        variant="ghost"
        icon="i-lucide-pencil"
        :disabled="isLoading || hypothesis === null"
        :aria-label="$t('ideaWorkspace.hypotheses.detail.actions.edit')"
        :title="$t('ideaWorkspace.hypotheses.detail.actions.edit')"
        @click="emit('edit')"
      />

      <UButton
        color="error"
        variant="ghost"
        icon="i-lucide-trash-2"
        :disabled="isLoading || hypothesis === null"
        :aria-label="$t('ideaWorkspace.hypotheses.detail.actions.delete')"
        :title="$t('ideaWorkspace.hypotheses.detail.actions.delete')"
        @click="emit('delete')"
      />
    </div>
  </div>
</template>
