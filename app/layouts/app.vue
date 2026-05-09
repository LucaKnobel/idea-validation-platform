<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <div class="min-h-screen bg-default">
    <UHeader :toggle="false">
      <template #left>
        <AppLogo
          size="md"
          :to="'/dashboard'"
        />
      </template>

      <template #right>
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
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
