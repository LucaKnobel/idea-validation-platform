<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <UPageHeader
      :title="$t('settings.title')"
      :description="$t('settings.description')"
    />

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          {{ $t('settings.general') }}
        </h2>
      </template>

      <div class="space-y-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            {{ $t('settings.theme') }}
          </p>

          <UColorModeButton />
        </div>

        <USeparator />

        <div class="flex items-center justify-between">
          <p class="text-sm text-muted">
            {{ $t('common.language') }}
          </p>

          <AppLocaleSelect />
        </div>
      </div>
    </UCard>

    <div class="space-y-6">
      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ $t('settings.account.title') }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          {{ $t('settings.account.placeholder') }}
        </p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ $t('settings.security.title') }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          {{ $t('settings.security.placeholder') }}
        </p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ $t('settings.subscription.title') }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          {{ $t('settings.subscription.placeholder') }}
        </p>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-error">
            {{ $t('settings.dangerZone.title') }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          {{ $t('settings.dangerZone.placeholder') }}
        </p>
      </UCard>
    </div>
  </div>
</template>
