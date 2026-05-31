<script setup lang="ts">
/**
 * Navigation item shared by the workspace sidebar and mobile drawer.
 */
type WorkspaceNavigationItem = {
  label: string
  to: string
  icon: string
  active: boolean
}

/**
 * Props for the desktop workspace sidebar.
 */
defineProps<{
  dashboardTo: string
  mainItems: WorkspaceNavigationItem[]
  settingsItem: WorkspaceNavigationItem
}>()
</script>

<template>
  <aside class="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-default lg:bg-default">
    <div class="px-6 py-5">
      <AppLogo
        size="md"
        :to="dashboardTo"
      />
    </div>

    <nav class="flex flex-1 flex-col px-3 pb-4">
      <div class="space-y-1">
        <UButton
          v-for="item in mainItems"
          :key="item.to"
          :to="item.to"
          :icon="item.icon"
          color="neutral"
          :variant="item.active ? 'soft' : 'ghost'"
          class="w-full justify-start rounded-lg px-3 py-2"
        >
          {{ item.label }}
        </UButton>
      </div>

      <div class="mt-auto pt-4">
        <USeparator class="mb-4" />

        <UButton
          :to="settingsItem.to"
          :icon="settingsItem.icon"
          color="neutral"
          :variant="settingsItem.active ? 'soft' : 'ghost'"
          class="w-full justify-start rounded-lg px-3 py-2"
        >
          {{ settingsItem.label }}
        </UButton>
      </div>
    </nav>
  </aside>
</template>
