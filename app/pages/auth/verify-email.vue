<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})
</script>

<template>
  <div class="flex flex-col items-center gap-6 text-center py-8">
    <UIcon
      name="i-lucide-mail-check"
      class="text-primary size-16"
    />
    <div class="flex flex-col gap-2">
      <h1 class="text-2xl font-bold">
        {{ $t('auth.verifyEmail.title') }}
      </h1>
      <p class="text-muted text-sm max-w-sm">
        {{ $t('auth.verifyEmail.message') }}
      </p>
    </div>
    <NuxtLinkLocale
      to="/auth/login"
      class="text-primary text-sm font-medium"
    >
      {{ $t('auth.verifyEmail.backToLogin') }}
    </NuxtLinkLocale>
  </div>
</template>
