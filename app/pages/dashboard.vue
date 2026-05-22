<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { CreateIdeaForm } from '~/composables/useCreateIdeaModal'

definePageMeta({
  middleware: ['auth-middleware'],
  layout: 'app'
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { isUpgradeModalOpen } = useUpgradeToProModal()
const UIcon = resolveComponent('UIcon')

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

const columns = computed<TableColumn<IdeaResponseDto>[]>(() => [
  {
    accessorKey: 'title',
    header: t('dashboard.table.columns.title'),
    size: 320,
    maxSize: 360,
    meta: {
      class: {
        th: 'md:w-[20rem]',
        td: 'md:w-[20rem]'
      }
    }
  },
  {
    accessorKey: 'description',
    header: t('dashboard.table.columns.description'),
    size: 420,
    maxSize: 460,
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
    size: 180,
    maxSize: 180,
    cell: ({ row }) => formatDate(row.original.createdAt),
    meta: {
      class: {
        th: 'hidden md:table-cell md:w-[11.25rem]',
        td: 'hidden md:table-cell md:w-[11.25rem] text-sm text-toned'
      }
    }
  },
  {
    accessorKey: 'updatedAt',
    header: t('dashboard.table.columns.updatedAt'),
    size: 180,
    maxSize: 180,
    cell: ({ row }) => formatDate(row.original.updatedAt),
    meta: {
      class: {
        th: 'hidden md:table-cell md:w-[11.25rem]',
        td: 'hidden md:table-cell md:w-[11.25rem] text-sm text-toned'
      }
    }
  },
  {
    id: 'actions',
    header: '',
    size: 48,
    maxSize: 48,
    cell: () => h(
      'div',
      { class: 'flex justify-end' },
      [
        h(UIcon, {
          name: 'i-lucide-chevron-right',
          class: 'size-5 shrink-0 text-muted'
        })
      ]
    ),
    meta: {
      class: {
        th: 'w-12 md:w-12',
        td: 'w-12 md:w-12'
      }
    }
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
  base: 'w-full table-fixed border-separate border-spacing-0'
}

const getIdeaWorkspaceRoute = (ideaId: string): string => localePath(`/idea-workspace/${ideaId}`)

const {
  isCreateModalOpen,
  isCreatingIdea,
  createIdeaFormState,
  createIdeaSchema,
  openCreateIdeaModal,
  submitCreateIdea
} = useCreateIdeaModal({
  createIdea
})

const onRowSelect = async (_event: Event, row: TableRow<IdeaResponseDto>): Promise<void> => {
  await navigateTo(getIdeaWorkspaceRoute(row.original.id))
}

const clearSearchAndReload = async (): Promise<void> => {
  searchInput.value = ''
  await applySearch()
}

const onCreateIdeaSubmit = async (form: CreateIdeaForm): Promise<void> => {
  await submitCreateIdea(form)
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
            :placeholder="$t('dashboard.searchPlaceholder')"
            size="md"
            :ui="{ trailing: 'pe-1' }"
            class="w-48 sm:w-64"
            @keydown.enter.prevent="applySearch"
          >
            <template
              v-if="searchInput?.length"
              #trailing
            >
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                icon="i-lucide-circle-x"
                aria-label="Clear input"
                @click="clearSearchAndReload"
              />
            </template>
          </UInput>

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
          <div class="dashboard-table-scroll md:h-full">
            <ClientOnly>
              <UTable
                class="h-[56vh] md:h-full"
                :data="ideas"
                :columns="columns"
                :loading="isLoading"
                :empty="$t('dashboard.table.empty')"
                sticky
                :ui="tableUi"
                @select="onRowSelect"
              >
                <template #title-cell="{ row }">
                  <div class="title-cell-content clamped-text line-clamp-2 w-full space-y-1 overflow-hidden">
                    <ULink
                      class="block max-w-full wrap-break-word font-medium text-highlighted hover:text-primary"
                      :to="getIdeaWorkspaceRoute(row.original.id)"
                      :title="row.original.title"
                    >
                      {{ row.original.title }}
                    </ULink>

                    <p class="text-sm text-muted md:hidden">
                      {{ row.original.description || '-' }}
                    </p>
                  </div>
                </template>

                <template #description-cell="{ row }">
                  <p
                    class="description-cell-content clamped-text line-clamp-2 text-sm text-muted"
                    :title="row.original.description || '-'"
                  >
                    {{ row.original.description || '-' }}
                  </p>
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

              <template #fallback>
                <div class="flex min-h-56 items-center justify-center px-6 py-10 text-sm text-muted">
                  {{ $t('common.loading') }}
                </div>
              </template>
            </ClientOnly>
          </div>
        </div>

        <div
          v-if="hasIdeas"
          class="pagination-dock"
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

    <AppCreateIdeaModal
      v-model:open="isCreateModalOpen"
      v-model:state="createIdeaFormState"
      :is-creating-idea="isCreatingIdea"
      :schema="createIdeaSchema"
      @submit="onCreateIdeaSubmit"
    />

    <AppUpgradeToProModal v-model:open="isUpgradeModalOpen" />
  </div>
</template>

<style scoped>
.pagination-dock {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 20;
  border-top: 1px solid var(--ui-border);
  background-color: color-mix(in srgb, var(--ui-bg) 95%, transparent);
  padding: 0.75rem 1rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
}

@media (min-width: 640px) {
  .pagination-dock {
    position: static;
    z-index: auto;
    border: 1px solid var(--ui-border);
    border-radius: 0.5rem;
    background-color: var(--ui-bg);
    padding: 0.5rem 1rem;
    box-shadow: none;
    backdrop-filter: none;
  }
}

@media (min-width: 768px) {
  .pagination-dock {
    flex-shrink: 0;
  }
}

.upgrade-callout {
  border-radius: 0.75rem;
  border: 1px solid;
  padding: 1rem;
  border-color: color-mix(in srgb, var(--ui-primary) 20%, transparent);
  background-color: color-mix(in srgb, var(--ui-primary) 5%, transparent);
}

@media (min-width: 768px) {
  .dashboard-table-layout {
    height: min(50rem, calc(100vh - 10rem));
  }

  .dashboard-table-scroll {
    height: 100%;
    overflow-y: auto;
  }

  .dashboard-table-scroll :deep(thead th) {
    position: sticky;
    top: 0;
    z-index: 5;
    background-color: var(--ui-bg);
  }
}

.clamped-text {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  word-break: break-word;
}
</style>
