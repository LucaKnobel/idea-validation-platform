<script setup lang="ts">
const { t } = useI18n()

type VersionActionType = 'iteration' | 'pivot'
type AlertColor = 'info' | 'primary' | 'warning' | 'error' | 'success' | 'secondary' | 'neutral'
type ButtonColor = 'info' | 'primary' | 'warning' | 'error' | 'success' | 'secondary' | 'neutral'

interface Props {
  open: boolean
  type: VersionActionType
  isLoading?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

const config = computed(() => {
  const configs: Record<VersionActionType, {
    title: string
    description: string
    body: string
    alertColor: AlertColor
    alertIcon: string
    confirmIcon: string
    confirmColor: ButtonColor
    confirmButtonText: string
    details: string[]
  }> = {
    iteration: {
      title: t('ideaWorkspace.versionActions.confirm.iteration.title'),
      description: t('ideaWorkspace.versionActions.confirm.iteration.description'),
      body: t('ideaWorkspace.versionActions.confirm.iteration.body'),
      alertColor: 'info',
      alertIcon: 'i-lucide-info',
      confirmIcon: 'i-lucide-check',
      confirmColor: 'primary',
      confirmButtonText: t('ideaWorkspace.versionActions.confirm.iteration.confirm'),
      details: [
        t('ideaWorkspace.versionActions.confirm.iteration.details.copyTitleDescription'),
        t('ideaWorkspace.versionActions.confirm.iteration.details.copyCanvas'),
        t('ideaWorkspace.versionActions.confirm.iteration.details.copyAllHypotheses'),
        t('ideaWorkspace.versionActions.confirm.iteration.details.copyEvidence')
      ]
    },
    pivot: {
      title: t('ideaWorkspace.versionActions.confirm.pivot.title'),
      description: t('ideaWorkspace.versionActions.confirm.pivot.description'),
      body: t('ideaWorkspace.versionActions.confirm.pivot.body'),
      alertColor: 'warning',
      alertIcon: 'i-lucide-triangle-alert',
      confirmIcon: 'i-lucide-check',
      confirmColor: 'warning',
      confirmButtonText: t('ideaWorkspace.versionActions.confirm.pivot.confirm'),
      details: [
        t('ideaWorkspace.versionActions.confirm.pivot.details.copyTitleDescription'),
        t('ideaWorkspace.versionActions.confirm.pivot.details.copyCanvas'),
        t('ideaWorkspace.versionActions.confirm.pivot.details.copySelectedHypotheses'),
        t('ideaWorkspace.versionActions.confirm.pivot.details.excludeInvalidated')
      ]
    }
  }

  return configs[props.type]
})
</script>

<template>
  <UModal
    :open="open"
    :title="config.title"
    :description="config.description"
    :dismissible="!isLoading"
    @update:open="(value) => emit('update:open', value)"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          :color="config.alertColor"
          variant="soft"
          :icon="config.alertIcon"
          :description="config.body"
        />

        <div class="rounded-lg border border-default p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-muted">
            {{ $t('ideaWorkspace.versionActions.confirm.whatHappens') }}
          </p>

          <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm text-default">
            <li
              v-for="(detail, index) in config.details"
              :key="index"
            >
              {{ detail }}
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="isLoading"
          @click="emit('update:open', false)"
        >
          {{ $t('actions.cancel') }}
        </UButton>

        <UButton
          :color="config.confirmColor"
          :icon="config.confirmIcon"
          :loading="isLoading"
          @click="emit('confirm')"
        >
          {{ config.confirmButtonText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
