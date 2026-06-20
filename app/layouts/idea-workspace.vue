<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()
const { toDashboard, toIdeaVersionSection, toHypothesesList } = useIdeaWorkspaceLinks()
const workspaceIdeaTitleState = useState<string | null>('workspace-idea-title', () => null)

const open = ref(true)

const closeSidebarOnMobile = () => {
  if (!import.meta.client) {
    return
  }

  if (window.matchMedia('(max-width: 1023px)').matches) {
    open.value = false
  }
}

const workspaceIdeaTitle = computed(() => {
  const stateTitle = workspaceIdeaTitleState.value

  if (typeof stateTitle === 'string' && stateTitle.length > 0) {
    return stateTitle
  }

  const metaTitle = route.meta.workspaceIdeaTitle

  return typeof metaTitle === 'string' && metaTitle.length > 0
    ? metaTitle
    : t('ideaWorkspace.placeholders.ideaTitle')
})

const navigationItems = computed(() => [
  {
    label: t('ideaWorkspace.navigation.overview'),
    to: toIdeaVersionSection('overview'),
    icon: 'i-lucide-layout-dashboard',
    active: route.path.endsWith('/overview'),
    onSelect: closeSidebarOnMobile
  },
  {
    label: t('ideaWorkspace.navigation.canvas'),
    to: toIdeaVersionSection('canvas'),
    icon: 'i-lucide-panels-top-left',
    active: route.path.endsWith('/canvas'),
    onSelect: closeSidebarOnMobile
  },
  {
    label: t('ideaWorkspace.navigation.hypotheses'),
    to: toHypothesesList(),
    icon: 'i-lucide-flask-conical',
    active: route.path.includes('/hypotheses'),
    onSelect: closeSidebarOnMobile
  },
  {
    label: t('ideaWorkspace.navigation.history'),
    to: toIdeaVersionSection('history'),
    icon: 'i-lucide-history',
    active: route.path.endsWith('/history'),
    onSelect: closeSidebarOnMobile
  }
])

const footerItems = computed(() => [
  {
    label: t('ideaWorkspace.actions.backToIdeas'),
    to: toDashboard(),
    icon: 'i-lucide-arrow-left',
    active: route.path === toDashboard(),
    onSelect: closeSidebarOnMobile
  },
  {
    label: t('ideaWorkspace.navigation.settings'),
    to: toIdeaVersionSection('settings'),
    icon: 'i-lucide-settings-2',
    active: route.path.endsWith('/settings'),
    onSelect: closeSidebarOnMobile
  }
])
</script>

<template>
  <div
    class="flex flex-1"
  >
    <USidebar
      v-model:open="open"
      variant="sidebar"
      collapsible="offcanvas"
      side="left"
      mode="modal"
      :ui="
        {
          container:
            'h-full'
        }"
    >
      <template #header>
        <AppLogo
          size="md"
          :to="'/dashboard'"
        />
      </template>

      <UNavigationMenu
        class="w-full"
        :items="navigationItems"
        orientation="vertical"
        :ui="{ link: 'w-full p-1.5 overflow-hidden' }"
      />

      <template #footer>
        <UNavigationMenu
          class="w-full"
          :items="footerItems"
          orientation="vertical"
          :ui="{ link: 'w-full p-1.5 overflow-hidden' }"
        />
      </template>
    </USidebar>

    <div
      class="flex-1 flex flex-col overflow-hidden bg-default"
    >
      <div class="h-(--ui-header-height) shrink-0 px-4">
        <div class="flex h-full items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-1">
            <UButton
              icon="i-lucide-panel-left"
              color="neutral"
              variant="ghost"
              aria-label="Toggle sidebar"
              @click="open = !open"
            />

            <h1 class="truncate text-base font-semibold">
              {{ workspaceIdeaTitle }}
            </h1>
          </div>

          <IdeaWorkspaceHeaderVersionControls />
        </div>
      </div>

      <div class="flex-1 p-4 overflow-auto">
        <slot />
      </div>
    </div>
  </div>
</template>
