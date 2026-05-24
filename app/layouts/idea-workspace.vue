<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useLocalePath, useI18n } from '#imports'

const route = useRoute()
const localePath = useLocalePath()
const { t } = useI18n()

const mobileDrawerOpen = ref(false)
const dashboardPath = computed(() => localePath('/dashboard'))

const navigation = computed(() => [
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

const settingsNav = computed(() => ({
  label: t('ideaWorkspace.navigation.settings'),
  to: localePath(`/ideas/${route.params.ideaId}/versions/${route.params.versionId}/settings`),
  icon: 'i-lucide-settings-2',
  active: route.path.endsWith('/settings')
}))
</script>

<template>
  <div class="flex h-dvh flex-col bg-default">
    <!-- Eigener flexibler Header -->
    <header class="flex items-center gap-4 px-6 py-6 border-b border-default bg-default min-h-20">
      <AppLogo size="md" />
      <span class="flex-1 text-center font-semibold text-xl truncate">
        {{ route.meta.workspaceIdeaTitle || t('ideaWorkspace.placeholders.ideaTitle') }}
      </span>
      <UButton
        icon="i-lucide-menu"
        class="lg:hidden"
        color="neutral"
        variant="ghost"
        :aria-label="t('ideaWorkspace.actions.openNavigation')"
        @click="mobileDrawerOpen = true"
      />
    </header>

    <div class="flex flex-1 min-h-0">
      <!-- Sidebar (Desktop) -->
      <USidebar class="hidden lg:flex w-64 flex-col border-r border-default bg-default">
        <div class="px-6 py-5 flex flex-col gap-2">
          <AppLogo
            size="md"
            :to="dashboardPath"
          />
          <UButton
            :to="dashboardPath"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="w-full justify-start mt-2"
          >
            {{ t('ideaWorkspace.actions.backToIdeas') }}
          </UButton>
        </div>
        <nav class="flex-1 px-3 pb-4">
          <div class="space-y-1">
            <UButton
              v-for="item in navigation"
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
              :to="settingsNav.to"
              :icon="settingsNav.icon"
              color="neutral"
              :variant="settingsNav.active ? 'soft' : 'ghost'"
              class="w-full justify-start rounded-lg px-3 py-2"
            >
              {{ settingsNav.label }}
            </UButton>
          </div>
        </nav>
      </USidebar>

      <!-- Main Content -->
      <main class="min-w-0 flex-1 overflow-y-auto">
        <div class="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile Drawer -->
    <USlideover
      v-model:open="mobileDrawerOpen"
      side="left"
      :ui="{ content: 'w-full max-w-xs' }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3 px-4 py-4">
          <AppLogo
            size="md"
            :to="dashboardPath"
          />
          <UButton
            :aria-label="t('ideaWorkspace.actions.closeNavigation')"
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            @click="mobileDrawerOpen = false"
          />
        </div>
      </template>
      <template #body>
        <div class="flex flex-col gap-2 px-4 py-4">
          <UButton
            :to="dashboardPath"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            class="w-full justify-start"
            @click="mobileDrawerOpen = false"
          >
            {{ t('ideaWorkspace.actions.backToIdeas') }}
          </UButton>
          <USeparator class="my-4" />
          <nav class="space-y-1">
            <UButton
              v-for="item in navigation"
              :key="item.to"
              :to="item.to"
              :icon="item.icon"
              color="neutral"
              :variant="item.active ? 'soft' : 'ghost'"
              class="w-full justify-start rounded-lg px-3 py-2"
              @click="mobileDrawerOpen = false"
            >
              {{ item.label }}
            </UButton>
            <UButton
              :to="settingsNav.to"
              :icon="settingsNav.icon"
              color="neutral"
              variant="ghost"
              class="w-full justify-start rounded-lg px-3 py-2"
              @click="mobileDrawerOpen = false"
            >
              {{ settingsNav.label }}
            </UButton>
          </nav>
        </div>
      </template>
    </USlideover>
  </div>
</template>
