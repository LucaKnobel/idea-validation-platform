<script setup lang="ts">
const route = useRoute()

const ideaId = computed(() => String(route.params.ideaId ?? '-'))
const versionId = computed(() => String(route.params.versionId ?? '-'))

const workspaceBasePath = computed(() => {
  if (ideaId.value === '-' || versionId.value === '-') {
    return '/dashboard'
  }

  return `/ideas/${ideaId.value}/versions/${versionId.value}`
})

const navigationItems = computed(() => [
  {
    label: 'Overview',
    to: `${workspaceBasePath.value}/overview`
  }
])
</script>

<template>
  <div class="min-h-screen bg-default">
    <header class="border-b border-default bg-default/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div class="flex items-center gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/dashboard"
            aria-label="Back to dashboard"
          />

          <div class="space-y-0.5">
            <p class="text-sm font-semibold text-highlighted">
              Idea {{ ideaId }}
            </p>
            <p class="text-xs text-muted">
              Version {{ versionId }}
            </p>
          </div>
        </div>

        <UBadge
          color="warning"
          variant="subtle"
        >
          Status: Open
        </UBadge>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
      <aside>
        <UCard>
          <nav class="space-y-1">
            <NuxtLink
              v-for="item in navigationItems"
              :key="item.to"
              :to="item.to"
              class="block rounded-md px-3 py-2 text-sm font-medium text-muted transition hover:bg-elevated hover:text-highlighted"
              active-class="bg-elevated text-highlighted"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </UCard>
      </aside>

      <main>
        <slot />
      </main>
    </div>
  </div>
</template>
