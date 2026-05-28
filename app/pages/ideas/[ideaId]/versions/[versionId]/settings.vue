<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const route = useRoute()
const { t } = useI18n()

const workspaceIdeaTitleState = useState<string | null>('workspace-idea-title', () => null)
const workspaceIdeaDescriptionState = useState<string | null>('workspace-idea-description', () => null)

const ideaId = computed(() => {
  const param = route.params.ideaId
  return typeof param === 'string' ? param : ''
})

const {
  isDeleteModalOpen,
  isDeletingIdea,
  openDeleteModal,
  closeDeleteModal,
  confirmDeleteIdea
} = useIdeaDelete({
  ideaId
})

const ideaTitle = computed(() => {
  const title = workspaceIdeaTitleState.value
  return typeof title === 'string' && title.length > 0
    ? title
    : t('ideaWorkspace.placeholders.ideaTitle')
})

const ideaDescription = computed(() => {
  const description = workspaceIdeaDescriptionState.value
  return typeof description === 'string' && description.trim().length > 0
    ? description
    : t('dashboard.table.noDescription')
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('settings.title')"
      :description="$t('settings.description')"
    />

    <UCard>
      <template #header>
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-highlighted">
            {{ $t('settings.dangerZone.title') }}
          </h2>
          <p class="text-sm text-muted">
            {{ t('dashboard.delete.warning') }}
          </p>
        </div>
      </template>

      <div class="max-w-2xl space-y-4">
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :title="$t('dashboard.delete.title')"
          :description="$t('dashboard.delete.description')"
        />

        <div class="space-y-2 rounded-lg border border-default p-3">
          <p class="text-xs uppercase tracking-wide text-toned">
            {{ $t('dashboard.delete.ideaLabel') }}
          </p>

          <p class="text-sm font-medium text-highlighted">
            {{ ideaTitle }}
          </p>

          <p class="text-xs text-toned line-clamp-2">
            {{ ideaDescription }}
          </p>
        </div>

        <div class="flex justify-end">
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :disabled="!ideaId"
            @click="openDeleteModal"
          >
            {{ $t('actions.delete') }}
          </UButton>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isDeleteModalOpen"
      :title="$t('dashboard.delete.title')"
      :description="$t('dashboard.delete.description')"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            :description="$t('dashboard.delete.warning')"
          />

          <div class="rounded-lg border border-default p-3">
            <p class="text-xs uppercase tracking-wide text-toned">
              {{ $t('dashboard.delete.ideaLabel') }}
            </p>
            <p class="mt-1 text-sm font-medium text-highlighted">
              {{ ideaTitle }}
            </p>
            <p class="mt-1 text-xs text-toned line-clamp-2">
              {{ ideaDescription }}
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="isDeletingIdea"
            @click="closeDeleteModal"
          >
            {{ $t('actions.cancel') }}
          </UButton>

          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="isDeletingIdea"
            @click="confirmDeleteIdea"
          >
            {{ $t('dashboard.delete.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
