<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Props for the workspace header shell.
 */
const props = defineProps<{
  backTo: string
  backLabel: string
  ideaTitle: string
  versionLabel: string
  statusLabel: string
  versionItems: DropdownMenuItem[][]
  mobileMenuLabel: string
}>()

/**
 * Emitted when the mobile navigation button is clicked.
 */
const emit = defineEmits<{
  toggleMenu: []
}>()
</script>

<template>
  <UHeader
    :toggle="false"
    :ui="{
      root: 'border-b border-default bg-default/95 backdrop-blur',
      container: 'w-full px-4 sm:px-6 lg:px-8',
      left: 'min-w-0 gap-2',
      center: 'min-w-0 flex-1 justify-center',
      right: 'gap-2'
    }"
  >
    <template #left>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          class="lg:hidden"
          :aria-label="props.mobileMenuLabel"
          @click="emit('toggleMenu')"
        />

        <UButton
          :to="props.backTo"
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="soft"
          size="sm"
          class="hidden rounded-full lg:inline-flex"
        >
          {{ props.backLabel }}
        </UButton>
      </div>
    </template>

    <template #default>
      <div class="min-w-0 flex-1 text-center">
        <p class="truncate text-sm font-semibold text-highlighted sm:text-base">
          {{ props.ideaTitle }}
        </p>
      </div>
    </template>

    <template #right>
      <div class="flex items-center justify-end gap-2">
        <IdeaWorkspaceVersionSwitcher
          :label="props.versionLabel"
          :items="props.versionItems"
        />

        <UBadge
          color="neutral"
          variant="soft"
          class="hidden md:inline-flex"
        >
          {{ props.statusLabel }}
        </UBadge>
      </div>
    </template>
  </UHeader>
</template>
