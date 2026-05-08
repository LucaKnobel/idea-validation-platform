<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()

const footerItems = computed(() => [{
  label: t('legal.privacyPolicy'),
  to: localePath('/legal/privacy')
},
{
  label: t('legal.imprint'),
  to: localePath('/legal/imprint')
},
{
  label: t('legal.termsOfService'),
  to: localePath('/legal/terms-of-service')
},
{
  label: t('systemInfo.linkLabel'),
  to: localePath('/system-info')
}])
</script>

<template>
  <USeparator />
  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        {{ $t('common.copyright') }} {{ new Date().getFullYear() }}
      </p>
    </template>
    <UNavigationMenu :items="footerItems" />
    <template #right>
      <AppLocaleSelect />
    </template>
  </UFooter>
</template>
