<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

/**
 * Workspace sections that share the same shell layout.
 */
type WorkspaceSection = 'overview' | 'canvas' | 'hypotheses' | 'decision' | 'history' | 'settings'

/**
 * Navigation item used by the workspace shell.
 */
type WorkspaceNavigationItem = {
  key: WorkspaceSection
  label: string
  to: string
  icon: string
  active: boolean
}

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const mobileDrawerOpen = ref(false)

const ideaId = computed(() => String(route.params.ideaId ?? ''))
const versionId = computed(() => String(route.params.versionId ?? ''))

const dashboardPath = computed(() => localePath('/dashboard'))

/**
 * Builds the locale-aware route for a workspace section.
 */
const buildWorkspaceRoute = (section: WorkspaceSection): string => localePath(`/ideas/${ideaId.value}/versions/${versionId.value}/${section}`)

/**
 * Falls back to a placeholder until the idea title is provided by page metadata.
 */
const workspaceIdeaTitle = computed(() => {
  const metaTitle = route.meta.workspaceIdeaTitle

  return typeof metaTitle === 'string' && metaTitle.length > 0
    ? metaTitle
    : t('ideaWorkspace.placeholders.ideaTitle')
})

/**
 * Falls back to a generic version label until the active version is wired.
 */
const workspaceVersionLabel = computed(() => {
  const metaVersionLabel = route.meta.workspaceVersionLabel

  return typeof metaVersionLabel === 'string' && metaVersionLabel.length > 0
    ? metaVersionLabel
    : t('ideaWorkspace.labels.version')
})

/**
 * Falls back to the default validation status used by the shell.
 */
const workspaceStatusLabel = computed(() => {
  const metaStatus = route.meta.workspaceStatus

  return typeof metaStatus === 'string' && metaStatus.length > 0
    ? metaStatus
    : t('ideaWorkspace.status.inValidation')
})

/**
 * Version dropdown content for the shell header.
 */
const versionMenuItems = computed<DropdownMenuItem[][]>(() => [
  [{
    label: workspaceVersionLabel.value,
    icon: 'i-lucide-check',
    disabled: true
  }],
  [{
    label: t('ideaWorkspace.versionSwitcher.comingSoon'),
    icon: 'i-lucide-clock-3',
    disabled: true
  }]
])

/**
 * Shared workspace navigation used by the sidebar and the mobile drawer.
 */
const navigationItems = computed<WorkspaceNavigationItem[]>(() => [
  {
    key: 'overview',
    label: t('ideaWorkspace.navigation.overview'),
    to: buildWorkspaceRoute('overview'),
    icon: 'i-lucide-layout-dashboard',
    active: route.path.endsWith('/overview')
  },
  {
    key: 'canvas',
    label: t('ideaWorkspace.navigation.canvas'),
    to: buildWorkspaceRoute('canvas'),
    icon: 'i-lucide-panels-top-left',
    active: route.path.endsWith('/canvas')
  },
  {
    key: 'hypotheses',
    label: t('ideaWorkspace.navigation.hypotheses'),
    to: buildWorkspaceRoute('hypotheses'),
    icon: 'i-lucide-flask-conical',
    active: route.path.includes('/hypotheses')
  },
  {
    key: 'decision',
    label: t('ideaWorkspace.navigation.decision'),
    to: buildWorkspaceRoute('decision'),
    icon: 'i-lucide-scale',
    active: route.path.endsWith('/decision')
  },
  {
    key: 'history',
    label: t('ideaWorkspace.navigation.history'),
    to: buildWorkspaceRoute('history'),
    icon: 'i-lucide-history',
    active: route.path.endsWith('/history')
  },
  {
    key: 'settings',
    label: t('ideaWorkspace.navigation.settings'),
    to: buildWorkspaceRoute('settings'),
    icon: 'i-lucide-settings-2',
    active: route.path.endsWith('/settings')
  }
])

/**
 * Desktop navigation excludes Settings so it can stay visually anchored below the separator.
 */
const primaryNavigationItems = computed(() => navigationItems.value.filter(item => item.key !== 'settings'))

/**
 * Dedicated Settings entry used in the lower section of the shell navigation.
 */
const settingsNavigationItem = computed<WorkspaceNavigationItem>(() => navigationItems.value.find(item => item.key === 'settings') ?? {
  key: 'settings',
  label: t('ideaWorkspace.navigation.settings'),
  to: buildWorkspaceRoute('settings'),
  icon: 'i-lucide-settings-2',
  active: false
})
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-default">
    <IdeaWorkspaceHeader
      :back-to="dashboardPath"
      :back-label="$t('ideaWorkspace.actions.backToIdeas')"
      :idea-title="workspaceIdeaTitle"
      :version-label="workspaceVersionLabel"
      :status-label="workspaceStatusLabel"
      :version-items="versionMenuItems"
      :mobile-menu-label="$t('ideaWorkspace.actions.openNavigation')"
      @toggle-menu="mobileDrawerOpen = true"
    />

    <div class="flex min-h-0 flex-1">
      <IdeaWorkspaceSidebar
        :dashboard-to="dashboardPath"
        :main-items="primaryNavigationItems"
        :settings-item="settingsNavigationItem"
      />

      <main class="min-w-0 flex-1 overflow-y-auto">
        <div class="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <slot />
        </div>
      </main>
    </div>

    <IdeaWorkspaceMobileDrawer
      v-model:open="mobileDrawerOpen"
      :dashboard-to="dashboardPath"
      :back-to="dashboardPath"
      :back-label="$t('ideaWorkspace.actions.backToIdeas')"
      :main-items="primaryNavigationItems"
      :settings-item="settingsNavigationItem"
      :close-label="$t('ideaWorkspace.actions.closeNavigation')"
    />
  </div>
</template>
