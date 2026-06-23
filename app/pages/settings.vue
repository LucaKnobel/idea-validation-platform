<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})

const {
  isSubscriptionStatusPending,
  isCancellingSubscription,
  currentPlanLabel,
  currentStatusLabel,
  showSubscribeAction,
  showCancelAction,
  startSubscriptionCheckout,
  cancelProSubscription
} = useSubscription()

const isCancelConfirmOpen = ref(false)

const openCancelConfirm = (): void => {
  isCancelConfirmOpen.value = true
}

const closeCancelConfirm = (): void => {
  isCancelConfirmOpen.value = false
}

const confirmCancelSubscription = async (): Promise<void> => {
  await cancelProSubscription()
  closeCancelConfirm()
}
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

        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{ $t('settings.subscription.description') }}
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              color="neutral"
              variant="soft"
            >
              {{ $t('settings.subscription.currentPlan') }}: {{ currentPlanLabel }}
            </UBadge>

            <UBadge
              color="primary"
              variant="soft"
            >
              {{ $t('settings.subscription.currentStatus') }}: {{ currentStatusLabel }}
            </UBadge>

            <UBadge
              v-if="isSubscriptionStatusPending"
              color="neutral"
              variant="subtle"
            >
              {{ $t('settings.subscription.loading') }}
            </UBadge>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row">
            <UButton
              v-if="showSubscribeAction"
              icon="i-lucide-badge-check"
              @click="startSubscriptionCheckout"
            >
              {{ $t('settings.subscription.actions.subscribe') }}
            </UButton>

            <UButton
              v-if="showCancelAction"
              color="error"
              variant="soft"
              icon="i-lucide-circle-off"
              :loading="isCancellingSubscription"
              :disabled="isCancellingSubscription"
              @click="openCancelConfirm"
            >
              {{ $t('settings.subscription.actions.cancel') }}
            </UButton>
          </div>

          <p class="text-xs text-toned">
            {{ $t('settings.subscription.note') }}
          </p>
        </div>
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

    <UModal
      v-model:open="isCancelConfirmOpen"
      :title="$t('settings.subscription.cancel.confirm.title')"
      :description="$t('settings.subscription.cancel.confirm.description')"
    >
      <template #body>
        <p class="text-sm text-toned">
          {{ $t('settings.subscription.cancel.confirm.warning') }}
        </p>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isCancellingSubscription"
            @click="closeCancelConfirm"
          >
            {{ $t('actions.cancel') }}
          </UButton>

          <UButton
            color="error"
            :loading="isCancellingSubscription"
            :disabled="isCancellingSubscription"
            @click="confirmCancelSubscription"
          >
            {{ $t('settings.subscription.cancel.confirm.action') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
