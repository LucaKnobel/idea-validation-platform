<script setup lang="ts">
/**
 * Placeholder section for hypothesis evidence.
 */
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ $t('ideaWorkspace.hypotheses.detail.evidence.title') }}
      </h2>
    </template>

    <div class="flex min-h-44 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-default px-5 py-8 text-center">
      <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
        <UIcon
          name="i-lucide-file-search"
          class="size-6 text-primary"
        />
      </div>

      <div class="space-y-1">
        <p class="font-medium text-highlighted">
          {{ $t('ideaWorkspace.hypotheses.detail.evidence.empty.title') }}
        </p>
        <p class="max-w-lg text-sm text-muted">
          {{ $t('ideaWorkspace.hypotheses.detail.evidence.empty.description') }}
        </p>
      </div>
    </div>
  </UCard>
</template>
