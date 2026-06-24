<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const localePath = useLocalePath()
const { t } = useI18n()
const { isAuthenticated } = useAuth()

const authActionTo = computed(() => {
  return isAuthenticated.value
    ? localePath('/dashboard')
    : localePath('/auth/login')
})

const authActionLabel = computed(() => {
  return isAuthenticated.value
    ? t('navigation.dashboard')
    : t('navigation.login')
})

const authActionIcon = computed(() => {
  return isAuthenticated.value
    ? 'i-lucide-layout-dashboard'
    : 'i-lucide-log-in'
})

const authActionTrailingIcon = computed(() => {
  return isAuthenticated.value
    ? 'i-lucide-arrow-right'
    : undefined
})

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
        :icon="authActionIcon"
        color="neutral"
        variant="ghost"
        :to="authActionTo"
        class="lg:hidden"
      />

      <UButton
        :label="authActionLabel"
        :trailing-icon="authActionTrailingIcon"
        color="neutral"
        variant="outline"
        :to="authActionTo"
        class="hidden lg:inline-flex"
      />

      <UButton
        v-if="!isAuthenticated"
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
        :label="authActionLabel"
        :trailing-icon="authActionTrailingIcon"
        color="neutral"
        variant="subtle"
        :to="authActionTo"
        block
        class="mb-3"
      />
      <UButton
        v-if="!isAuthenticated"
        :label="$t('navigation.register')"
        color="neutral"
        :to="localePath('/auth/register')"
        block
      />
    </template>
  </UHeader>
</template>
