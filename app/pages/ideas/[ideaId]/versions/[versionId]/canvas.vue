<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const route = useRoute()
const { t } = useI18n()
const { showSuccess, showError } = useToastNotification()

const ideaId = computed(() => {
  const value = route.params.ideaId
  return typeof value === 'string' ? value : ''
})

const versionId = computed(() => {
  const value = route.params.versionId
  return typeof value === 'string' ? value : ''
})

const {
  sectionOrder,
  sectionMeta,
  sectionLayoutClass,
  draft,
  hasUnsavedChanges,
  isLoading,
  isSaving,
  hasError,
  reloadCanvas: reloadCanvasData,
  saveCanvas: saveCanvasData
} = useCanvas()

const canLoadCanvas = computed(() => ideaId.value.length > 0 && versionId.value.length > 0)

const reloadCanvas = async (): Promise<void> => {
  if (!canLoadCanvas.value) {
    return
  }

  await reloadCanvasData({
    ideaId: ideaId.value,
    versionId: versionId.value
  })
}

const saveCanvas = async (): Promise<void> => {
  if (!canLoadCanvas.value) {
    return
  }

  const saved = await saveCanvasData({
    ideaId: ideaId.value,
    versionId: versionId.value
  })

  if (!saved) {
    showError('ideaWorkspace.canvasPage.error.title', 'ideaWorkspace.canvasPage.error.message')
    return
  }
  showSuccess('ideaWorkspace.canvasPage.success.title', 'ideaWorkspace.canvasPage.success.message')
}

onMounted(async () => {
  await reloadCanvas()
})
</script>

<template>
  <div class="space-y-6">
    <UPageHeader
      :title="$t('ideaWorkspace.canvasPage.title')"
      :description="$t('ideaWorkspace.canvasPage.description')"
    />

    <div class="flex flex-wrap items-center gap-2">
      <UBadge
        color="neutral"
        variant="subtle"
      >
        {{ $t('ideaWorkspace.canvasPage.bulletHint') }}
      </UBadge>

      <UBadge
        v-if="hasUnsavedChanges"
        color="warning"
        variant="soft"
      >
        {{ $t('ideaWorkspace.canvasPage.unsaved') }}
      </UBadge>

      <div class="ms-auto flex items-center gap-2">
        <UButton
          v-if="hasUnsavedChanges"
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="isLoading"
          :disabled="isLoading || isSaving"
          @click="reloadCanvas"
        >
          {{ $t('ideaWorkspace.canvasPage.actions.reset') }}
        </UButton>

        <UButton
          color="primary"
          icon="i-lucide-save"
          :loading="isSaving"
          :disabled="isLoading || isSaving || !hasUnsavedChanges"
          @click="saveCanvas"
        >
          {{ $t('actions.save') }}
        </UButton>
      </div>
    </div>

    <UAlert
      v-if="hasError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="$t('ideaWorkspace.canvasPage.error.title')"
      :description="$t('ideaWorkspace.canvasPage.error.message')"
    />

    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-4 lg:grid-cols-5"
    >
      <USkeleton
        v-for="section in sectionOrder"
        :key="section"
        class="h-56 rounded-lg"
      />
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:grid-rows-6 lg:gap-0 lg:h-[calc(100vh-18rem)] lg:min-h-192 lg:max-h-256"
    >
      <section
        v-for="section in sectionOrder"
        :key="section"
        :class="[
          'flex min-h-80 h-full flex-col gap-3 rounded-lg border border-default bg-muted/20 p-3 shadow-sm ring-1 ring-default/40',
          'lg:min-h-0 lg:rounded-none lg:border lg:border-accented/70 lg:bg-default lg:shadow-none lg:ring-0',
          sectionLayoutClass[section]
        ]"
      >
        <div class="flex items-center justify-between gap-2 border-b border-default/80 pb-2">
          <h2 class="text-sm font-semibold text-highlighted">
            {{ t(sectionMeta[section].labelKey) }}
          </h2>
          <UIcon
            :name="sectionMeta[section].icon"
            class="size-5 text-muted"
          />
        </div>

        <div class="min-h-0 flex-1">
          <UTextarea
            v-model="draft[section]"
            :rows="1"
            class="h-full w-full"
            color="neutral"
            variant="subtle"
            :highlight="false"
            :ui="{
              base: 'h-full min-h-0 resize-none align-top border-none ring-0'
            }"
            :placeholder="$t('ideaWorkspace.canvasPage.sectionPlaceholder')"
            :disabled="isSaving"
          />
        </div>
      </section>
    </div>
  </div>
</template>
