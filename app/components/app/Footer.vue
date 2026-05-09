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

    <div class="w-full">
      <UNavigationMenu
        :items="footerItems"
        variant="link"
        class="hidden w-full justify-center md:flex"
      />

      <UNavigationMenu
        :items="footerItems"
        variant="link"
        orientation="vertical"
        class="md:hidden"
      />
    </div>

    <template #right>
      <div class="flex w-full justify-start md:w-auto md:justify-end">
        <AppLocaleSelect />
      </div>
    </template>
  </UFooter>
</template>
