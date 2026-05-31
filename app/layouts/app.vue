<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-default">
    <header class="z-50 flex h-14 shrink-0 items-center border-b border-default bg-default px-4 sm:px-6 lg:px-8">
      <div class="flex w-full items-center justify-between">
        <AppLogo
          size="md"
          :to="'/dashboard'"
        />

        <div class="flex items-center gap-1">
          <UButton
            :to="localePath('/settings')"
            icon="i-lucide-settings"
            color="neutral"
            variant="ghost"
            :aria-label="$t('navigation.settings')"
          >
            <span class="hidden md:inline">
              {{ $t('navigation.settings') }}
            </span>
          </UButton>
          <AppLogoutButton />
        </div>
      </div>
    </header>

    <main class="flex-1 overflow-y-auto">
      <div class="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <slot />
      </div>
    </main>
  </div>
</template>
