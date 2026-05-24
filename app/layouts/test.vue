<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const open = ref(true)

const workspaceIdeaTitle = computed(() => {
  const metaTitle = route.meta.workspaceIdeaTitle
  return typeof metaTitle === 'string' && metaTitle.length > 0
    ? metaTitle
    : t('ideaWorkspace.placeholders.ideaTitle')
})

const navigationItems = computed(() => [
  {
    label: t('ideaWorkspace.navigation.overview'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/overview`),
    icon: 'i-lucide-layout-dashboard',
    active: route.path.endsWith('/overview')
  },
  {
    label: t('ideaWorkspace.navigation.canvas'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/canvas`),
    icon: 'i-lucide-panels-top-left',
    active: route.path.endsWith('/canvas')
  },
  {
    label: t('ideaWorkspace.navigation.hypotheses'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/hypotheses`),
    icon: 'i-lucide-flask-conical',
    active: route.path.includes('/hypotheses')
  },
  {
    label: t('ideaWorkspace.navigation.decision'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/decision`),
    icon: 'i-lucide-scale',
    active: route.path.endsWith('/decision')
  },
  {
    label: t('ideaWorkspace.navigation.history'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/history`),
    icon: 'i-lucide-history',
    active: route.path.endsWith('/history')
  }
])

const footerItems = computed(() => [
  {
    label: t('ideaWorkspace.actions.backToIdeas'),
    to: localePath('/dashboard'),
    icon: 'i-lucide-arrow-left',
    active: route.path === localePath('/dashboard')
  },
  {
    label: t('ideaWorkspace.navigation.settings'),
    to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/settings`),
    icon: 'i-lucide-settings-2',
    active: route.path.endsWith('/settings')
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
          :to="localePath('/dashboard')"
        />
      </template>

      <UNavigationMenu
        :items="navigationItems"
        orientation="vertical"
        :ui="{ link: 'p-1.5 overflow-hidden' }"
      />

      <template #footer>
        <UNavigationMenu
          :items="footerItems"
          orientation="vertical"
          :ui="{ link: 'p-1.5 overflow-hidden' }"
        />
      </template>
    </USidebar>

    <div
      class="flex-1 flex flex-col overflow-hidden bg-default"
    >
      <div
        class="h-(--ui-header-height) shrink-0 flex items-center px-4"
      >
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

      <div class="flex-1 p-4">
        <Placeholder class="size-full" />
      </div>
    </div>
  </div>
</template>
