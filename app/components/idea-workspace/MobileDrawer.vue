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
 * Controls the open state of the mobile workspace drawer.
 */
const open = defineModel<boolean>('open', { default: false })

/**
 * Props for the mobile workspace drawer.
 */
const props = defineProps<{
  dashboardTo: string
  backTo: string
  backLabel: string
  mainItems: WorkspaceNavigationItem[]
  settingsItem: WorkspaceNavigationItem
  closeLabel: string
}>()

/**
 * Closes the drawer after navigation or explicit user action.
 */
const closeDrawer = (): void => {
  open.value = false
}
</script>

<template>
  <USlideover
    v-model:open="open"
    side="left"
    :ui="{
      content: 'w-full max-w-xs',
      header: 'px-4 py-4',
      body: 'px-0 py-0'
    }"
  >
    <template #header>
      <div class="flex w-full items-center justify-between gap-3">
        <AppLogo
          size="md"
          :to="props.dashboardTo"
        />

        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          :aria-label="props.closeLabel"
          @click="closeDrawer"
        />
      </div>
    </template>

    <template #body>
      <div class="flex h-full flex-col bg-default px-4 py-4">
        <UButton
          :to="props.backTo"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="w-full justify-start"
          @click="closeDrawer"
        >
          {{ props.backLabel }}
        </UButton>

        <USeparator class="my-4" />

        <nav class="space-y-1">
          <UButton
            v-for="item in props.mainItems"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
            color="neutral"
            :variant="item.active ? 'soft' : 'ghost'"
            class="w-full justify-start rounded-lg px-3 py-2"
            @click="closeDrawer"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <div class="mt-auto pt-4">
          <USeparator class="mb-4" />

          <UButton
            :to="props.settingsItem.to"
            :icon="props.settingsItem.icon"
            color="neutral"
            :variant="props.settingsItem.active ? 'soft' : 'ghost'"
            class="w-full justify-start rounded-lg px-3 py-2"
            @click="closeDrawer"
          >
            {{ props.settingsItem.label }}
          </UButton>
        </div>
      </div>
    </template>
  </USlideover>
</template>
