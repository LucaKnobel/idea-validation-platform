<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Row } from '@tanstack/vue-table'

/**
 * Props for hypotheses table presentation.
 */
interface HypothesesTableProps {
  hypotheses: HypothesisResponseDto[]
  isLoading: boolean
  isDeletingId: string | null
}

const props = defineProps<HypothesesTableProps>()

const emit = defineEmits<{
  (event: 'create'): void
  (event: 'edit' | 'delete' | 'open-details', hypothesis: HypothesisResponseDto): void
}>()

const { t } = useI18n()

const {
  columns,
  sorting,
  priorityColor,
  statusColor,
  dimensionLabel,
  priorityLabel,
  statusLabel,
  getHypothesisUiStatus
} = useHypothesesTable()

/**
 * Builds table row actions for the dropdown menu.
 */
const getDesktopRowItems = (row: Row<HypothesisResponseDto>): DropdownMenuItem[][] => {
  return [[
    {
      label: t('ideaWorkspace.hypotheses.actions.openDetails'),
      onSelect: () => {
        emit('open-details', row.original)
      }
    },
    {
      label: t('actions.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', row.original)
    },
    {
      type: 'separator'
    },
    {
      label: t('actions.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete', row.original)
    }
  ]]
}

/**
 * Builds row actions for the dedicated mobile list layout.
 */
const getMobileRowItems = (hypothesis: HypothesisResponseDto): DropdownMenuItem[][] => {
  return [[
    {
      label: t('ideaWorkspace.hypotheses.actions.openDetails'),
      onSelect: () => {
        emit('open-details', hypothesis)
      }
    },
    {
      label: t('actions.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', hypothesis)
    },
    {
      type: 'separator'
    },
    {
      label: t('actions.delete'),
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => emit('delete', hypothesis)
    }
  ]]
}

/**
 * Maps TanStack sorting state to the icon used in sortable table headers.
 */
const getSortHeaderIcon = (isSorted: false | 'asc' | 'desc'): string => {
  if (isSorted === 'asc') {
    return 'i-lucide-arrow-up-narrow-wide'
  }

  if (isSorted === 'desc') {
    return 'i-lucide-arrow-down-wide-narrow'
  }

  return 'i-lucide-arrow-up-down'
}
</script>

<template>
  <ClientOnly>
    <div class="space-y-3 md:hidden">
      <div
        v-if="props.isLoading"
        class="py-6 text-center text-sm text-muted"
      >
        {{ $t('common.loading') }}
      </div>

      <div
        v-else-if="props.hypotheses.length === 0"
        class="flex min-h-56 flex-col items-center justify-center gap-4 px-6 py-10 text-center"
      >
        <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
          <UIcon
            name="i-lucide-flask-conical"
            class="size-6 text-primary"
          />
        </div>

        <div class="space-y-1">
          <p class="font-medium text-highlighted">
            {{ $t('ideaWorkspace.hypotheses.empty.title') }}
          </p>
          <p class="max-w-md text-sm text-muted">
            {{ $t('ideaWorkspace.hypotheses.empty.description') }}
          </p>
        </div>

        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="emit('create')"
        >
          {{ $t('ideaWorkspace.hypotheses.actions.create') }}
        </UButton>
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <article
          v-for="hypothesis in props.hypotheses"
          :key="hypothesis.id"
          class="rounded-xl border border-default bg-default p-3"
        >
          <div class="flex items-start gap-3">
            <button
              type="button"
              class="min-w-0 flex-1 text-left"
              @click="emit('open-details', hypothesis)"
            >
              <p class="overflow-hidden text-ellipsis whitespace-normal wrap-break-word text-sm leading-5 font-medium text-highlighted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {{ hypothesis.statement }}
              </p>
            </button>

            <UDropdownMenu
              :content="{ align: 'end' }"
              :items="getMobileRowItems(hypothesis)"
              :aria-label="t('ideaWorkspace.hypotheses.table.columns.actions')"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
                square
                size="sm"
                :loading="props.isDeletingId === hypothesis.id"
                :aria-label="t('ideaWorkspace.hypotheses.table.columns.actions')"
              />
            </UDropdownMenu>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <UBadge
              color="neutral"
              variant="soft"
            >
              {{ dimensionLabel(hypothesis.dimension) }}
            </UBadge>

            <UBadge
              :color="priorityColor(hypothesis.priority)"
              variant="soft"
            >
              {{ priorityLabel(hypothesis.priority) }}
            </UBadge>

            <UBadge
              :color="statusColor(getHypothesisUiStatus(hypothesis))"
              variant="subtle"
            >
              {{ statusLabel(getHypothesisUiStatus(hypothesis)) }}
            </UBadge>
          </div>
        </article>
      </div>
    </div>

    <UTable
      v-model:sorting="sorting"
      class="hidden max-h-[calc(100dvh-14rem)] md:table"
      sticky="header"
      :data="props.hypotheses"
      :get-row-id="(row: HypothesisResponseDto) => row.id"
      :columns="columns"
      :loading="props.isLoading"
      :empty="$t('ideaWorkspace.hypotheses.table.empty')"
      :ui="{
        root: 'overflow-auto',
        separator: 'hidden',
        td: 'px-4 py-3 align-top empty:p-0',
        base: 'min-w-[72rem] w-full table-fixed border-separate border-spacing-0'
      }"
    >
      <template #statement-header>
        <span class="text-sm font-medium text-highlighted">
          {{ t('ideaWorkspace.hypotheses.table.columns.statement') }}
        </span>
      </template>

      <template #dimension-header="{ column }">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('ideaWorkspace.hypotheses.table.columns.dimension')"
          :icon="getSortHeaderIcon(column.getIsSorted())"
          class="-mx-2.5 hidden md:inline-flex"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"
        />
      </template>

      <template #priority-header="{ column }">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('ideaWorkspace.hypotheses.table.columns.priority')"
          :icon="getSortHeaderIcon(column.getIsSorted())"
          class="-mx-2.5 hidden md:inline-flex"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"
        />
      </template>

      <template #status-header="{ column }">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('ideaWorkspace.hypotheses.table.columns.status')"
          :icon="getSortHeaderIcon(column.getIsSorted())"
          class="-mx-2.5 hidden md:inline-flex"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"
        />
      </template>

      <template #statement-cell="{ row }">
        <button
          type="button"
          class="w-full min-h-10 py-1 text-left"
          @click="emit('open-details', row.original)"
        >
          <p class="overflow-hidden text-ellipsis whitespace-normal wrap-break-word text-sm leading-5 font-medium text-highlighted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {{ row.original.statement }}
          </p>
        </button>
      </template>

      <template #dimension-cell="{ row }">
        <div class="flex min-h-10 items-center">
          <UBadge
            color="neutral"
            variant="soft"
          >
            {{ dimensionLabel(row.original.dimension) }}
          </UBadge>
        </div>
      </template>

      <template #priority-cell="{ row }">
        <div class="flex min-h-10 items-center">
          <UBadge
            :color="priorityColor(row.original.priority)"
            variant="soft"
          >
            {{ priorityLabel(row.original.priority) }}
          </UBadge>
        </div>
      </template>

      <template #status-cell="{ row }">
        <div class="flex min-h-10 items-center">
          <UBadge
            :color="statusColor(getHypothesisUiStatus(row.original))"
            variant="subtle"
          >
            {{ statusLabel(getHypothesisUiStatus(row.original)) }}
          </UBadge>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <UDropdownMenu
          :content="{
            align: 'end'
          }"
          :items="getDesktopRowItems(row)"
          :aria-label="t('ideaWorkspace.hypotheses.table.columns.actions')"
        >
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            square
            size="sm"
            :loading="props.isDeletingId === row.original.id"
            :aria-label="t('ideaWorkspace.hypotheses.table.columns.actions')"
          />
        </UDropdownMenu>
      </template>

      <template #loading>
        <div class="py-6 text-center text-sm text-muted">
          {{ $t('common.loading') }}
        </div>
      </template>

      <template #empty>
        <div class="flex min-h-56 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
          <div class="flex size-12 items-center justify-center rounded-full bg-elevated">
            <UIcon
              name="i-lucide-flask-conical"
              class="size-6 text-primary"
            />
          </div>

          <div class="space-y-1">
            <p class="font-medium text-highlighted">
              {{ $t('ideaWorkspace.hypotheses.empty.title') }}
            </p>
            <p class="max-w-md text-sm text-muted">
              {{ $t('ideaWorkspace.hypotheses.empty.description') }}
            </p>
          </div>

          <UButton
            icon="i-lucide-plus"
            color="primary"
            @click="emit('create')"
          >
            {{ $t('ideaWorkspace.hypotheses.actions.create') }}
          </UButton>
        </div>
      </template>
    </UTable>

    <template #fallback>
      <div class="py-6 text-center text-sm text-muted">
        {{ $t('common.loading') }}
      </div>
    </template>
  </ClientOnly>
</template>
