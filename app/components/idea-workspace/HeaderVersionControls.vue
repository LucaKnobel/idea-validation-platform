<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import VersionActionConfirmModal from './VersionActionConfirmModal.vue'

const { t } = useI18n()

const {
  hasVersionContext,
  versionItems,
  versionLabel,
  isVersionsLoading,
  isCreatingVersion,
  isIterationConfirmOpen,
  isPivotConfirmOpen,
  openIterationConfirm,
  openPivotConfirm,
  closeIterationConfirm,
  closePivotConfirm,
  confirmCreateIteration,
  confirmCreatePivot
} = useIdeaVersionOverview()

/**
 * Combines version switching and version actions into one compact mobile menu.
 */
const mobileMenuItems = computed<DropdownMenuItem[][]>(() => {
  return [
    ...versionItems.value,
    [
      {
        label: t('ideaWorkspace.versionActions.createIteration'),
        icon: 'i-lucide-plus',
        onSelect: openIterationConfirm
      },
      {
        label: t('ideaWorkspace.versionActions.createPivot'),
        icon: 'i-lucide-git-branch',
        onSelect: openPivotConfirm
      }
    ]
  ]
})
</script>

<template>
  <div
    v-if="hasVersionContext"
    class="flex items-center gap-2"
  >
    <div class="hidden items-center gap-2 md:flex">
      <IdeaWorkspaceVersionSwitcher
        :label="versionLabel"
        :items="versionItems"
      />

      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-plus"
        size="sm"
        :loading="isVersionsLoading || isCreatingVersion"
        @click="openIterationConfirm"
      >
        {{ t('ideaWorkspace.versionActions.createIteration') }}
      </UButton>

      <UButton
        color="warning"
        variant="soft"
        icon="i-lucide-git-branch"
        size="sm"
        :loading="isVersionsLoading || isCreatingVersion"
        @click="openPivotConfirm"
      >
        {{ t('ideaWorkspace.versionActions.createPivot') }}
      </UButton>
    </div>

    <UDropdownMenu
      :items="mobileMenuItems"
      class="md:hidden"
      :content="{ align: 'end', side: 'bottom', sideOffset: 8 }"
      :ui="{ content: 'min-w-64' }"
    >
      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-ellipsis-vertical"
        size="sm"
        :loading="isVersionsLoading || isCreatingVersion"
        :aria-label="t('ideaWorkspace.versionActions.mobileMenuLabel')"
      />
    </UDropdownMenu>

    <VersionActionConfirmModal
      :open="isIterationConfirmOpen"
      type="iteration"
      :is-loading="isCreatingVersion"
      @update:open="(value: boolean) => !value && closeIterationConfirm()"
      @confirm="confirmCreateIteration"
    />

    <VersionActionConfirmModal
      :open="isPivotConfirmOpen"
      type="pivot"
      :is-loading="isCreatingVersion"
      @update:open="(value: boolean) => !value && closePivotConfirm()"
      @confirm="confirmCreatePivot"
    />
  </div>
</template>
