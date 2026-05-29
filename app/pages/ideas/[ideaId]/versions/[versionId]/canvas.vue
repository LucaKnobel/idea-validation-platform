<script setup lang="ts">
definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'idea-workspace'
})

const route = useRoute()
const { t } = useI18n()
const { showSuccess, showError } = useToastNotification()

const sectionOrder = [
  'KEY_PARTNERS',
  'KEY_ACTIVITIES',
  'VALUE_PROPOSITIONS',
  'CUSTOMER_RELATIONSHIPS',
  'CUSTOMER_SEGMENTS',
  'KEY_RESOURCES',
  'CHANNELS',
  'COST_STRUCTURE',
  'REVENUE_STREAMS'
] as const

type CanvasSectionType = (typeof sectionOrder)[number]

const sectionMeta: Record<CanvasSectionType, { labelKey: string, icon: string, rows: number }> = {
  KEY_PARTNERS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.KEY_PARTNERS',
    icon: 'i-lucide-link-2',
    rows: 6
  },
  KEY_ACTIVITIES: {
    labelKey: 'ideaWorkspace.canvasPage.sections.KEY_ACTIVITIES',
    icon: 'i-lucide-zap',
    rows: 4
  },
  VALUE_PROPOSITIONS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.VALUE_PROPOSITIONS',
    icon: 'i-lucide-gift',
    rows: 6
  },
  CUSTOMER_RELATIONSHIPS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.CUSTOMER_RELATIONSHIPS',
    icon: 'i-lucide-heart',
    rows: 4
  },
  CUSTOMER_SEGMENTS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.CUSTOMER_SEGMENTS',
    icon: 'i-lucide-users',
    rows: 6
  },
  KEY_RESOURCES: {
    labelKey: 'ideaWorkspace.canvasPage.sections.KEY_RESOURCES',
    icon: 'i-lucide-factory',
    rows: 4
  },
  CHANNELS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.CHANNELS',
    icon: 'i-lucide-truck',
    rows: 4
  },
  COST_STRUCTURE: {
    labelKey: 'ideaWorkspace.canvasPage.sections.COST_STRUCTURE',
    icon: 'i-lucide-tag',
    rows: 5
  },
  REVENUE_STREAMS: {
    labelKey: 'ideaWorkspace.canvasPage.sections.REVENUE_STREAMS',
    icon: 'i-lucide-wallet',
    rows: 5
  }
}

const sectionLayoutClass: Record<CanvasSectionType, string> = {
  KEY_PARTNERS: 'lg:col-span-2 lg:row-span-4',
  KEY_ACTIVITIES: 'lg:col-span-2 lg:row-span-2',
  VALUE_PROPOSITIONS: 'lg:col-span-2 lg:row-span-4',
  CUSTOMER_RELATIONSHIPS: 'lg:col-span-2 lg:row-span-2',
  CUSTOMER_SEGMENTS: 'lg:col-span-2 lg:row-span-4',
  KEY_RESOURCES: 'lg:col-span-2 lg:row-span-2',
  CHANNELS: 'lg:col-span-2 lg:row-span-2',
  COST_STRUCTURE: 'lg:col-span-5 lg:row-span-2',
  REVENUE_STREAMS: 'lg:col-span-5 lg:row-span-2'
}

const createEmptyDraft = (): Record<CanvasSectionType, string> => {
  return {
    KEY_PARTNERS: '',
    KEY_ACTIVITIES: '',
    VALUE_PROPOSITIONS: '',
    CUSTOMER_RELATIONSHIPS: '',
    CUSTOMER_SEGMENTS: '',
    KEY_RESOURCES: '',
    CHANNELS: '',
    COST_STRUCTURE: '',
    REVENUE_STREAMS: ''
  }
}

const ideaId = computed(() => {
  const value = route.params.ideaId
  return typeof value === 'string' ? value : ''
})

const versionId = computed(() => {
  const value = route.params.versionId
  return typeof value === 'string' ? value : ''
})

const { elements, isLoading, isSaving, hasError, loadCanvas, replaceCanvas } = useCanvas()

const draft = ref<Record<CanvasSectionType, string>>(createEmptyDraft())
const persistedSnapshot = ref<string>('')

const createSnapshot = (state: Record<CanvasSectionType, string>): string => {
  return JSON.stringify(sectionOrder.map(section => [section, state[section].trim()]))
}

const parseSectionToEntries = (section: CanvasSectionType, text: string): Array<{ type: CanvasSectionType, content: string }> => {
  return text
    .split('\n')
    .map(line => line.trim())
    .map(line => line.replace(/^[-*]\s*/, '').trim())
    .filter(line => line.length > 0)
    .map(content => ({ type: section, content }))
}

const syncDraftFromElements = (): void => {
  const nextDraft = createEmptyDraft()

  for (const section of sectionOrder) {
    const sectionItems = elements.value
      .filter(item => item.type === section)
      .map(item => item.content.trim())
      .filter(content => content.length > 0)

    nextDraft[section] = sectionItems.length > 0
      ? sectionItems.map(content => `- ${content}`).join('\n')
      : ''
  }

  draft.value = nextDraft
  persistedSnapshot.value = createSnapshot(nextDraft)
}

const hasUnsavedChanges = computed(() => {
  return createSnapshot(draft.value) !== persistedSnapshot.value
})

const canLoadCanvas = computed(() => ideaId.value.length > 0 && versionId.value.length > 0)

const reloadCanvas = async (): Promise<void> => {
  if (!canLoadCanvas.value) {
    return
  }

  await loadCanvas({
    ideaId: ideaId.value,
    versionId: versionId.value
  })
}

const saveCanvas = async (): Promise<void> => {
  if (!canLoadCanvas.value) {
    return
  }

  const payload = sectionOrder.flatMap(section => parseSectionToEntries(section, draft.value[section]))

  const saved = await replaceCanvas({
    ideaId: ideaId.value,
    versionId: versionId.value,
    elements: payload
  })

  if (!saved) {
    showError('ideaWorkspace.canvasPage.error.title', 'ideaWorkspace.canvasPage.error.message')
    return
  }

  syncDraftFromElements()
  showSuccess('ideaWorkspace.canvasPage.success.title', 'ideaWorkspace.canvasPage.success.message')
}

watch(elements, () => {
  syncDraftFromElements()
})

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
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="isLoading"
          :disabled="isLoading || isSaving"
          @click="reloadCanvas"
        >
          {{ $t('actions.refresh') }}
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
      class="grid grid-cols-1 gap-4 lg:grid-cols-10 lg:auto-rows-[7rem] lg:gap-0"
    >
      <section
        v-for="section in sectionOrder"
        :key="section"
        :class="[
          'flex h-full flex-col gap-3 rounded-lg border-2 border-accented/70 bg-muted/20 p-3 shadow-sm',
          'lg:rounded-none lg:border lg:border-accented/80 lg:bg-default lg:shadow-none',
          sectionLayoutClass[section]
        ]"
      >
        <div class="flex items-center justify-between gap-2 border-b border-accented/60 pb-2">
          <h2 class="text-sm font-semibold text-highlighted">
            {{ t(sectionMeta[section].labelKey) }}
          </h2>
          <UIcon
            :name="sectionMeta[section].icon"
            class="size-5 text-muted"
          />
        </div>

        <UTextarea
          v-model="draft[section]"
          :rows="sectionMeta[section].rows"
          class="w-full"
          :placeholder="$t('ideaWorkspace.canvasPage.sectionPlaceholder')"
          :disabled="isSaving"
        />
      </section>
    </div>
  </div>
</template>
