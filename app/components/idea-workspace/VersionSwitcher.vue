<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Props for the workspace version switcher trigger.
 */
defineProps<{
  label: string
  items: DropdownMenuItem[][]
}>()
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{
      align: 'end',
      side: 'bottom',
      sideOffset: 8
    }"
    :ui="{
      content: 'min-w-52'
    }"
  >
    <UButton
      color="neutral"
      variant="outline"
      trailing-icon="i-lucide-chevron-down"
      size="sm"
      class="justify-between"
    >
      <span class="truncate">
        {{ label }}
      </span>
    </UButton>
  </UDropdownMenu>
</template>
