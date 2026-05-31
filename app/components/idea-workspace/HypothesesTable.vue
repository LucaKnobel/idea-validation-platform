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
  (event: 'edit' | 'delete', hypothesis: HypothesisResponseDto): void
}>()

const { t } = useI18n()

const {
  columns,
  expanded,
  sorting,
  priorityColor,
  dimensionLabel,
  priorityLabel,
  sectionLabel,
  statusLabel,
  getHypothesisUiStatus
} = useHypothesesTable()

/**
 * Builds table row actions for the dropdown menu.
 */
const getDesktopRowItems = (row: Row<HypothesisResponseDto>): DropdownMenuItem[][] => {
  return [[
    {
      label: t('actions.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', row.original)
    },
    {
      label: row.getIsExpanded()
        ? t('ideaWorkspace.hypotheses.table.actions.collapse')
        : t('ideaWorkspace.hypotheses.table.actions.expand'),
      icon: row.getIsExpanded() ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down',
      onSelect: () => row.toggleExpanded()
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
      label: t('actions.edit'),
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', hypothesis)
    },
    {
      label: isExpanded(hypothesis.id)
        ? t('ideaWorkspace.hypotheses.table.actions.collapse')
        : t('ideaWorkspace.hypotheses.table.actions.expand'),
      icon: isExpanded(hypothesis.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down',
      onSelect: () => toggleExpandedById(hypothesis.id)
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

/**
 * Returns whether a hypothesis is currently expanded.
 */
const isExpanded = (hypothesisId: string): boolean => {
  return expanded.value[hypothesisId] === true
}

/**
 * Toggles a row by hypothesis identifier so mobile and desktop can share expansion state.
 */
const toggleExpandedById = (hypothesisId: string): void => {
  expanded.value = {
    ...expanded.value,
    [hypothesisId]: !isExpanded(hypothesisId)
  }
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
          class="overflow-hidden rounded-xl border border-default bg-default"
        >
          <div class="flex items-start gap-3 p-3">
            <button
              type="button"
              class="min-w-0 flex-1 text-left"
              @click="toggleExpandedById(hypothesis.id)"
            >
              <div class="flex items-start gap-2">
                <p class="flex-1 overflow-hidden text-ellipsis whitespace-normal wrap-break-word text-sm leading-5 font-medium text-highlighted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                  {{ hypothesis.statement }}
                </p>

                <UIcon
                  name="i-lucide-chevron-down"
                  class="mt-0.5 size-4 shrink-0 text-muted transition-transform"
                  :class="isExpanded(hypothesis.id) ? 'rotate-180' : ''"
                />
              </div>
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

          <div
            v-if="isExpanded(hypothesis.id)"
            class="border-t border-default bg-elevated/40 p-3"
          >
            <div class="grid gap-2">
              <div class="rounded-lg border border-default bg-default p-2">
                <p class="text-xs text-muted">
                  {{ t('ideaWorkspace.hypotheses.table.columns.dimension') }}
                </p>
                <UBadge
                  color="neutral"
                  variant="soft"
                  class="mt-1"
                >
                  {{ dimensionLabel(hypothesis.dimension) }}
                </UBadge>
              </div>

              <div class="rounded-lg border border-default bg-default p-2">
                <p class="text-xs text-muted">
                  {{ t('ideaWorkspace.hypotheses.table.columns.priority') }}
                </p>
                <UBadge
                  :color="priorityColor(hypothesis.priority)"
                  variant="soft"
                  class="mt-1"
                >
                  {{ priorityLabel(hypothesis.priority) }}
                </UBadge>
              </div>

              <div class="rounded-lg border border-default bg-default p-2">
                <p class="text-xs text-muted">
                  {{ t('ideaWorkspace.hypotheses.table.columns.status') }}
                </p>
                <UBadge
                  color="neutral"
                  variant="soft"
                  class="mt-1"
                >
                  {{ statusLabel(getHypothesisUiStatus(hypothesis)) }}
                </UBadge>
              </div>

              <div class="rounded-lg border border-default bg-default p-3">
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.canvas.title') }}
                </p>

                <div class="mt-2 flex flex-wrap gap-2">
                  <UBadge
                    v-for="link in hypothesis.canvasSectionLinks"
                    :key="link.id"
                    color="neutral"
                    variant="soft"
                  >
                    {{ sectionLabel(link.canvasElementType as CreateHypothesisBodyDto['canvasSectionTypes'][number]) }}
                  </UBadge>

                  <p
                    v-if="hypothesis.canvasSectionLinks.length === 0"
                    class="text-sm text-muted"
                  >
                    {{ t('ideaWorkspace.hypotheses.expanded.canvas.empty') }}
                  </p>
                </div>
              </div>

              <div class="rounded-lg border border-default bg-default p-3">
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.metrics.title') }}
                </p>
                <p class="mt-2 text-sm text-muted">
                  {{ t('ideaWorkspace.hypotheses.expanded.metrics.placeholder') }}
                </p>
              </div>

              <div class="rounded-lg border border-default bg-default p-3">
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.experiments.title') }}
                </p>
                <p class="mt-2 text-sm text-muted">
                  {{ t('ideaWorkspace.hypotheses.expanded.experiments.placeholder') }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>

    <UTable
      v-model:expanded="expanded"
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
        tr: 'data-[expanded=true]:bg-primary/5',
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
        <div class="space-y-2 py-1">
          <p class="w-full min-h-10 overflow-hidden text-ellipsis whitespace-normal wrap-break-word text-sm leading-5 font-medium text-highlighted [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {{ row.original.statement }}
          </p>
        </div>
      </template>

      <template #expand-cell="{ row }">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-chevron-down"
          square
          size="sm"
          class="hidden md:inline-flex"
          :aria-label="row.getIsExpanded() ? t('ideaWorkspace.hypotheses.table.actions.collapse') : t('ideaWorkspace.hypotheses.table.actions.expand')"
          :ui="{
            leadingIcon: ['transition-transform', row.getIsExpanded() ? 'duration-200 rotate-180' : '']
          }"
          @click="row.toggleExpanded()"
        />
      </template>

      <template #dimension-cell="{ row }">
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ dimensionLabel(row.original.dimension) }}
        </UBadge>
      </template>

      <template #priority-cell="{ row }">
        <UBadge
          :color="priorityColor(row.original.priority)"
          variant="soft"
        >
          {{ priorityLabel(row.original.priority) }}
        </UBadge>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          color="neutral"
          variant="soft"
        >
          {{ statusLabel(getHypothesisUiStatus(row.original)) }}
        </UBadge>
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

      <template #expanded="{ row }">
        <div class="border-t border-default bg-primary/5 px-3 pb-3 pt-2 sm:p-4 md:border-y">
          <div class="mb-3 grid gap-2 md:hidden">
            <div class="rounded-lg border border-default bg-default p-2">
              <p class="text-xs text-muted">
                {{ t('ideaWorkspace.hypotheses.table.columns.dimension') }}
              </p>
              <UBadge
                color="neutral"
                variant="soft"
                class="mt-1"
              >
                {{ dimensionLabel(row.original.dimension) }}
              </UBadge>
            </div>

            <div class="rounded-lg border border-default bg-default p-2">
              <p class="text-xs text-muted">
                {{ t('ideaWorkspace.hypotheses.table.columns.priority') }}
              </p>
              <UBadge
                :color="priorityColor(row.original.priority)"
                variant="soft"
                class="mt-1"
              >
                {{ priorityLabel(row.original.priority) }}
              </UBadge>
            </div>

            <div class="rounded-lg border border-default bg-default p-2">
              <p class="text-xs text-muted">
                {{ t('ideaWorkspace.hypotheses.table.columns.status') }}
              </p>
              <UBadge
                color="neutral"
                variant="soft"
                class="mt-1"
              >
                {{ statusLabel(getHypothesisUiStatus(row.original)) }}
              </UBadge>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <UCard>
              <template #header>
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.canvas.title') }}
                </p>
              </template>

              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="link in row.original.canvasSectionLinks"
                  :key="link.id"
                  color="neutral"
                  variant="soft"
                >
                  {{ sectionLabel(link.canvasElementType as CreateHypothesisBodyDto['canvasSectionTypes'][number]) }}
                </UBadge>

                <p
                  v-if="row.original.canvasSectionLinks.length === 0"
                  class="text-sm text-muted"
                >
                  {{ t('ideaWorkspace.hypotheses.expanded.canvas.empty') }}
                </p>
              </div>
            </UCard>

            <UCard>
              <template #header>
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.metrics.title') }}
                </p>
              </template>

              <p class="text-sm text-muted">
                {{ t('ideaWorkspace.hypotheses.expanded.metrics.placeholder') }}
              </p>
            </UCard>

            <UCard>
              <template #header>
                <p class="text-sm font-semibold text-highlighted">
                  {{ t('ideaWorkspace.hypotheses.expanded.experiments.title') }}
                </p>
              </template>

              <p class="text-sm text-muted">
                {{ t('ideaWorkspace.hypotheses.expanded.experiments.placeholder') }}
              </p>
            </UCard>
          </div>
        </div>
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
