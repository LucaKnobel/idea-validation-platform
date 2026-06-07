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

  <div class="flex flex-col gap-4 rounded-xl border border-default bg-default p-4 md:flex-row md:items-start md:justify-between">
    <div class="min-w-0 flex-1 space-y-2">
      <USkeleton
        v-if="isLoading"
        class="h-8 w-full max-w-2xl"
      />

      <h1
        v-else
        class="text-2xl leading-8 font-semibold text-highlighted md:text-3xl"
      >
        {{ hypothesisStatement }}
      </h1>
    </div>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-pencil"
        :disabled="isLoading || hypothesis === null"
        @click="emit('edit')"
      >
        {{ $t('ideaWorkspace.hypotheses.detail.actions.edit') }}
      </UButton>

      <UButton
        color="error"
        variant="soft"
        icon="i-lucide-trash-2"
        :disabled="isLoading || hypothesis === null"
        @click="emit('delete')"
      >
        {{ $t('ideaWorkspace.hypotheses.detail.actions.delete') }}
      </UButton>
    </div>
  </div>
</template>
