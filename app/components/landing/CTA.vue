<script setup lang="ts">
import type { ButtonProps } from '#ui/types'

const localePath = useLocalePath()
const { t } = useI18n()

const links: ButtonProps[] = [
  {
    label: t('landing.hero.ctaPrimary'),
    to: localePath('/auth/register')
  },
  {
    label: t('landing.hero.ctaSecondary'),
    to: localePath('/demo'),
    color: 'neutral',
    variant: 'outline',
    trailingIcon: 'i-lucide-arrow-right'
  }
]
</script>

<template>
  <section class="relative overflow-hidden">
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-primary/30 via-primary/10 to-transparent"
    />
    <UPageHero
      class="relative z-10"
      :title="$t('landing.hero.title')"
      :description="$t('landing.hero.description')"
      :links="links"
    />
  </section>
</template>
