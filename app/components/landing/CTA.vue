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
  <div>
    <UPageHero
      :title="$t('landing.hero.title')"
      :description="$t('landing.hero.description')"
      :links="links"
    />
  </div>
</template>
