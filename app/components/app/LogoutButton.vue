<script setup lang="ts">
const {
  isOpen,
  isLoggingOut,
  hasError,
  errorTitle,
  errorText,
  openDialog,
  closeDialog,
  handleLogout
} = useLogout()
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="$t('auth.logout.title')"
    :description="$t('auth.logout.description')"
  >
    <UButton
      color="error"
      variant="ghost"
      icon="i-lucide-log-out"
      :aria-label="$t('navigation.logout')"
      @click="openDialog"
    >
      <span class="hidden md:inline">
        {{ $t('navigation.logout') }}
      </span>
    </UButton>

    <template #body>
      <div class="space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="$t('auth.logout.warning.title')"
          :description="$t('auth.logout.warning.description')"
        />

        <UAlert
          v-if="hasError"
          color="error"
          icon="i-lucide-circle-alert"
          :title="errorTitle"
          :description="errorText"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeDialog"
        >
          {{ $t('actions.cancel') }}
        </UButton>

        <UButton
          color="error"
          :loading="isLoggingOut"
          @click="handleLogout"
        >
          {{ $t('auth.logout.confirm') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
