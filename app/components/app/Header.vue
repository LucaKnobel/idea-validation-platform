<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const localePath = useLocalePath()
const { t } = useI18n()

const items = computed<NavigationMenuItem[]>(() => [{
  label: t('navigation.howItWorks'),
  to: localePath('/how-it-works'),
  icon: 'i-lucide-book-open'
}, {
  label: t('navigation.features'),
  to: localePath('/features'),
  icon: 'i-lucide-sparkles'
}, {
  label: t('navigation.pricing'),
  icon: 'i-lucide-dollar-sign',
  to: localePath('/pricing')
}])
</script>

<template>
  <UHeader>
    <template #left>
      <AppLogo size="md" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />

      <UButton
        icon="i-lucide-log-in"
        color="neutral"
        variant="ghost"
        :to="localePath('/auth/login')"
        class="lg:hidden"
      />

      <UButton
        :label="$t('navigation.login')"
        color="neutral"
        variant="outline"
        :to="localePath('/auth/login')"
        class="hidden lg:inline-flex"
      />

      <UButton
        :label="$t('navigation.register')"
        color="neutral"
        trailing-icon="i-lucide-arrow-right"
        class="hidden lg:inline-flex"
        :to="localePath('/auth/register')"
      />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

      <UButton
        :label="$t('navigation.login')"
        color="neutral"
        variant="subtle"
        :to="localePath('/auth/login')"
        block
        class="mb-3"
      />
      <UButton
        :label="$t('navigation.register')"
        color="neutral"
        :to="localePath('/auth/register')"
        block
      />
    </template>
  </UHeader>
</template>
