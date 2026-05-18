<script setup lang="ts">
import type { FormSubmitEvent, TableRow } from '@nuxt/ui'
import { computed } from 'vue'
import * as z from 'zod'
import type { IdeaResponseDto } from '../../shared/types/idea'

definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { showSuccess, showError } = useToastNotification()

const {
  ideas,
  isLoading,
  hasError,
  page,
  pageSize,
  total,
  searchInput,
  applySearch,
  createIdea
} = useIdeasDashboard()

interface CreateIdeaForm {
  title: string
  description?: string
}

const isCreateModalOpen = ref(false)
const isCreatingIdea = ref(false)
const isUpgradeModalOpen = ref(false)

const createIdeaFormState = reactive<CreateIdeaForm>({
  title: '',
  description: ''
})

const createIdeaSchema = computed(() => z.object({
  title: z.string().trim().min(1, t('dashboard.createForm.validation.titleRequired')).max(200, t('dashboard.createForm.validation.titleTooLong')),
  description: z.string().trim().max(3000, t('dashboard.createForm.validation.descriptionTooLong')).optional().or(z.literal(''))
}))

const columns = computed(() => [
  {
    accessorKey: 'title',
    header: t('dashboard.table.columns.title')
  },
  {
    accessorKey: 'description',
    header: t('dashboard.table.columns.description'),
    meta: {
      class: {
        th: 'hidden md:table-cell',
        td: 'hidden md:table-cell'
      }
    }
  },
  {
    accessorKey: 'createdAt',
    header: t('dashboard.table.columns.createdAt'),
    meta: {
      class: {
        th: 'hidden md:table-cell',
        td: 'hidden md:table-cell whitespace-nowrap'
      }
    }
  },
  {
    accessorKey: 'updatedAt',
    header: t('dashboard.table.columns.updatedAt'),
    meta: {
      class: {
        th: 'hidden md:table-cell',
        td: 'hidden md:table-cell whitespace-nowrap'
      }
    }
  },
  {
    id: 'actions',
    header: ''
  }
])

const rangeStart = computed(() => {
  if (total.value === 0) {
    return 0
  }

  return (page.value - 1) * pageSize.value + 1
})

const rangeEnd = computed(() => {
  if (total.value === 0) {
    return 0
  }

  return Math.min(page.value * pageSize.value, total.value)
})

const hasIdeas = computed(() => total.value > 0)

const formatter = computed(() => new Intl.DateTimeFormat(locale.value, {
  dateStyle: 'medium',
  timeStyle: 'short'
}))

const formatDate = (value: string): string => formatter.value.format(new Date(value))

const tableUi = {
  separator: 'hidden',
  th: 'sticky top-0 z-10 bg-default',
  tr: 'data-[selectable=true]:cursor-pointer data-[selectable=true]:transition-colors data-[selectable=true]:duration-150 data-[selectable=true]:hover:bg-elevated/70 data-[selectable=true]:active:bg-elevated'
}

const openCreateIdeaModal = (): void => {
  createIdeaFormState.title = ''
  createIdeaFormState.description = ''
  isCreateModalOpen.value = true
}

const closeCreateIdeaModal = (): void => {
  if (isCreatingIdea.value) {
    return
  }

  isCreateModalOpen.value = false
}

const getIdeaWorkspaceRoute = (ideaId: string): string => localePath(`/idea-workspace/${ideaId}`)

const onRowSelect = async (_event: Event, row: TableRow<IdeaResponseDto>): Promise<void> => {
  await navigateTo(getIdeaWorkspaceRoute(row.original.id))
}

const openUpgradeModal = (): void => {
  isUpgradeModalOpen.value = true
}

const closeUpgradeModal = (): void => {
  isUpgradeModalOpen.value = false
}

const onCreateIdeaSubmit = async (event: FormSubmitEvent<{ title: string, description?: string }>): Promise<void> => {
  if (isCreatingIdea.value) {
    return
  }

  isCreatingIdea.value = true

  try {
    const created = await createIdea({
      title: event.data.title,
      description: (event.data.description ?? '').trim() ? event.data.description : undefined
    })

    if (!created) {
      return
    }

    showSuccess('dashboard.createForm.success.title', 'dashboard.createForm.success.message')

    isCreateModalOpen.value = false
  } catch (error: unknown) {
    const statusCode = extractStatusCode(error)

    if (statusCode === 403) {
      isCreateModalOpen.value = false
      openUpgradeModal()
      return
    }

    showError('dashboard.createForm.error.title', 'dashboard.createForm.error.message')
  } finally {
    isCreatingIdea.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          {{ $t('dashboard.title') }}
        </h1>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        size="md"
        class="w-full justify-center self-start rounded-xl px-4 shadow-sm ring-1 ring-primary/20 sm:w-auto sm:self-auto"
        @click="openCreateIdeaModal"
      >
        {{ $t('dashboard.createIdea') }}
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            :placeholder="$t('dashboard.searchPlaceholder')"
            size="md"
            class="w-48 sm:w-64"
            @keydown.enter.prevent="applySearch"
          />

          <UButton
            icon="i-lucide-search"
            color="neutral"
            size="md"
            variant="soft"
            :aria-label="$t('actions.search')"
            :loading="isLoading"
            @click="applySearch"
          >
            <span class="hidden sm:inline">{{ $t('actions.search') }}</span>
          </UButton>
        </div>
      </template>

      <UAlert
        v-if="hasError"
        class="mt-4"
        color="error"
        variant="soft"
        :title="$t('dashboard.error.title')"
        :description="$t('dashboard.error.message')"
      />

      <div class="dashboard-table-layout mt-4 space-y-4 pb-20 sm:pb-0 md:flex md:flex-col md:space-y-4">
        <div class="overflow-hidden rounded-lg border border-default md:flex-1">
          <div class="dashboard-table-scroll h-[56vh] overflow-y-auto md:h-full md:overflow-y-visible">
            <UTable
              :data="ideas"
              :columns="columns"
              :loading="isLoading"
              :empty="$t('dashboard.table.empty')"
              :ui="tableUi"
              @select="onRowSelect"
            >
              <template #title-cell="{ row }">
                <div class="space-y-1">
                  <ULink
                    class="font-medium text-highlighted hover:text-primary"
                    :to="getIdeaWorkspaceRoute(row.original.id)"
                  >
                    {{ row.original.title }}
                  </ULink>

                  <p class="text-sm text-muted md:hidden">
                    {{ row.original.description || '-' }}
                  </p>
                </div>
              </template>

              <template #description-cell="{ row }">
                <p class="line-clamp-2 text-sm text-muted">
                  {{ row.original.description || '-' }}
                </p>
              </template>

              <template #createdAt-cell="{ row }">
                <span class="text-sm text-toned">
                  {{ formatDate(row.original.createdAt) }}
                </span>
              </template>

              <template #updatedAt-cell="{ row }">
                <span class="text-sm text-toned">
                  {{ formatDate(row.original.updatedAt) }}
                </span>
              </template>

              <template #actions-cell>
                <div class="flex justify-end">
                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 text-muted"
                  />
                </div>
              </template>

              <template #empty>
                <div class="flex min-h-56 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
                  <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
                    <UIcon
                      name="i-lucide-lightbulb"
                      class="size-6 text-primary"
                    />
                  </div>

                  <div class="space-y-1">
                    <p class="font-medium text-highlighted">
                      {{ $t('dashboard.empty.title') }}
                    </p>
                    <p class="max-w-md text-sm text-muted">
                      {{ $t('dashboard.empty.description') }}
                    </p>
                  </div>

                  <UButton
                    icon="i-lucide-plus"
                    color="primary"
                    @click="openCreateIdeaModal"
                  >
                    {{ $t('dashboard.createIdea') }}
                  </UButton>
                </div>
              </template>
            </UTable>
          </div>
        </div>

        <div
          v-if="hasIdeas"
          class="fixed inset-x-0 bottom-0 z-20 border-t border-default bg-default/95 px-4 py-3 shadow-lg backdrop-blur sm:static sm:z-auto sm:rounded-lg sm:border sm:bg-default sm:px-4 sm:py-2 sm:shadow-none sm:backdrop-blur-0 md:shrink-0"
        >
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p class="text-sm text-muted">
              {{ $t('dashboard.paginationSummary', { from: rangeStart, to: rangeEnd, total }) }}
            </p>

            <UPagination
              v-model:page="page"
              :total="total"
              :items-per-page="pageSize"
              show-edges
              :disabled="isLoading"
            />
          </div>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="isCreateModalOpen"
      :title="$t('dashboard.createForm.title')"
      :description="$t('dashboard.createForm.description')"
      :dismissible="!isCreatingIdea"
      :ui="{
        content: 'w-[92vw] sm:max-w-2xl md:min-w-[44rem]',
        body: 'space-y-6'
      }"
    >
      <template #body>
        <div class="rounded-xl border border-default bg-elevated/40 p-4">
          <p class="text-sm text-toned">
            {{ $t('dashboard.createForm.intro') }}
          </p>
        </div>

        <UForm
          :schema="createIdeaSchema"
          :state="createIdeaFormState"
          class="space-y-5"
          @submit="onCreateIdeaSubmit"
        >
          <UFormField
            name="title"
            :label="$t('dashboard.createForm.fields.title.label')"
            :description="$t('dashboard.createForm.fields.title.description')"
            required
          >
            <UInput
              v-model="createIdeaFormState.title"
              :placeholder="$t('dashboard.createForm.fields.title.placeholder')"
              :disabled="isCreatingIdea"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="description"
            :label="$t('dashboard.createForm.fields.description.label')"
            :description="$t('dashboard.createForm.fields.description.description')"
          >
            <UTextarea
              v-model="createIdeaFormState.description"
              :placeholder="$t('dashboard.createForm.fields.description.placeholder')"
              :disabled="isCreatingIdea"
              :rows="4"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="isCreatingIdea"
              @click="closeCreateIdeaModal"
            >
              {{ $t('actions.cancel') }}
            </UButton>

            <UButton
              type="submit"
              color="primary"
              icon="i-lucide-plus"
              :loading="isCreatingIdea"
            >
              {{ $t('dashboard.createIdea') }}
            </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <UModal
      v-model:open="isUpgradeModalOpen"
      :title="$t('dashboard.upgradeModal.title')"
      :description="$t('dashboard.upgradeModal.description')"
      :ui="{
        content: 'w-[92vw] sm:max-w-xl',
        body: 'space-y-5',
        footer: 'justify-end'
      }"
    >
      <template #body>
        <div class="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p class="text-sm text-toned">
            {{ $t('dashboard.upgradeModal.pitch') }}
          </p>
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeUpgradeModal"
        >
          {{ $t('actions.cancel') }}
        </UButton>

        <UButton
          icon="i-lucide-sparkles"
          color="primary"
          :to="localePath('/upgrade-to-pro')"
          @click="closeUpgradeModal"
        >
          {{ $t('dashboard.upgradeModal.cta') }}
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
@media (min-width: 768px) and (max-height: 900px) {
  .dashboard-table-layout {
    height: calc(100vh - 14rem);
  }

  .dashboard-table-scroll {
    height: 100%;
    overflow-y: auto;
  }
}

@media (min-width: 768px) and (min-height: 901px) {
  .dashboard-table-layout {
    height: 42rem;
  }

  .dashboard-table-scroll {
    height: 100%;
    max-height: none;
    overflow-y: visible;
  }
}
</style>
