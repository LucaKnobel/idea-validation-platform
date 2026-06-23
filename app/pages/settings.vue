<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})

const localePath = useLocalePath()

const {
  formState: passwordChangeState,
  formSchema: passwordChangeSchema,
  isChangingPassword,
  hasError: hasPasswordChangeError,
  errorTitle: passwordChangeErrorTitle,
  errorText: passwordChangeErrorText,
  submitPasswordChange
} = usePasswordChange()
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
const {
  isDeleteModalOpen,
  isDeletingAccount,
  openDeleteModal,
  closeDeleteModal,
  confirmDeleteAccount
} = useAccountDelete()

const isCancelConfirmOpen = ref(false)
const showPasswords = ref(false)

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
    <div>
      <UButton
        :to="localePath('/dashboard')"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-arrow-left"
        :aria-label="$t('settings.actions.backToDashboard')"
      >
        {{ $t('settings.actions.backToDashboard') }}
      </UButton>
    </div>

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
            {{ $t('settings.security.title') }}
          </h2>
        </template>

        <UForm
          :schema="passwordChangeSchema"
          :state="passwordChangeState"
          class="space-y-5"
          @submit="submitPasswordChange"
        >
          <div class="space-y-2">
            <p class="text-sm text-muted">
              {{ $t('settings.security.description') }}
            </p>

            <UAlert
              color="neutral"
              variant="subtle"
              icon="i-lucide-shield-check"
              :title="$t('validation.password.requirements')"
              :description="$t('settings.security.passwordRequirements')"
            />
          </div>

          <UAlert
            v-if="hasPasswordChangeError && passwordChangeErrorTitle"
            color="error"
            variant="subtle"
            icon="i-lucide-circle-alert"
            :title="passwordChangeErrorTitle"
            :description="passwordChangeErrorText"
          />

          <UFormField
            name="currentPassword"
            :label="$t('settings.security.fields.currentPassword.label')"
            required
          >
            <UInput
              id="settings-current-password"
              v-model="passwordChangeState.currentPassword"
              :type="showPasswords ? 'text' : 'password'"
              :placeholder="$t('settings.security.fields.currentPassword.placeholder')"
              :disabled="isChangingPassword"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
              autocomplete="current-password"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswords ? $t('form.password.hide') : $t('form.password.show')"
                  :aria-pressed="showPasswords"
                  aria-controls="settings-current-password"
                  @click="showPasswords = !showPasswords"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField
            name="newPassword"
            :label="$t('settings.security.fields.newPassword.label')"
            required
          >
            <UInput
              id="settings-new-password"
              v-model="passwordChangeState.newPassword"
              :type="showPasswords ? 'text' : 'password'"
              :placeholder="$t('settings.security.fields.newPassword.placeholder')"
              :disabled="isChangingPassword"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
              autocomplete="new-password"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswords ? $t('form.password.hide') : $t('form.password.show')"
                  :aria-pressed="showPasswords"
                  aria-controls="settings-new-password"
                  @click="showPasswords = !showPasswords"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField
            name="passwordConfirm"
            :label="$t('settings.security.fields.passwordConfirm.label')"
            required
          >
            <UInput
              id="settings-password-confirm"
              v-model="passwordChangeState.passwordConfirm"
              :type="showPasswords ? 'text' : 'password'"
              :placeholder="$t('settings.security.fields.passwordConfirm.placeholder')"
              :disabled="isChangingPassword"
              :ui="{ trailing: 'pe-1' }"
              class="w-full"
              autocomplete="new-password"
            >
              <template #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  :icon="showPasswords ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  :aria-label="showPasswords ? $t('form.password.hide') : $t('form.password.show')"
                  :aria-pressed="showPasswords"
                  aria-controls="settings-password-confirm"
                  @click="showPasswords = !showPasswords"
                />
              </template>
            </UInput>
          </UFormField>

          <div class="flex justify-end">
            <UButton
              type="submit"
              icon="i-lucide-key-round"
              :loading="isChangingPassword"
              :disabled="isChangingPassword"
            >
              {{ $t('settings.security.actions.submit') }}
            </UButton>
          </div>
        </UForm>
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
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-error">
            {{ $t('settings.dangerZone.title') }}
          </h2>
        </template>

        <div class="space-y-4">
          <p class="text-sm text-muted">
            {{ $t('account.delete.description') }}
          </p>

          <UButton
            color="error"
            variant="soft"
            icon="i-lucide-user-round-x"
            @click="openDeleteModal"
          >
            {{ $t('account.delete.action') }}
          </UButton>
        </div>
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

    <UModal
      v-model:open="isDeleteModalOpen"
      :title="$t('account.delete.title')"
      :description="$t('account.delete.description')"
    >
      <template #body>
        <p class="text-sm text-toned">
          {{ $t('account.delete.warning') }}
        </p>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isDeletingAccount"
            @click="closeDeleteModal"
          >
            {{ $t('actions.cancel') }}
          </UButton>

          <UButton
            color="error"
            :loading="isDeletingAccount"
            :disabled="isDeletingAccount"
            @click="confirmDeleteAccount"
          >
            {{ $t('account.delete.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
