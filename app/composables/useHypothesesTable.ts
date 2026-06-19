import type { TableColumn } from '@nuxt/ui'
import type {
  HypothesisDimension,
  HypothesisPriority,
  HypothesisResponseDto
} from '#shared/types/hypothesis'

/**
 * Domain status used across the hypothesis table and detail views.
 */
export type HypothesisUiStatus = HypothesisResponseDto['status']

/**
 * Public API for rendering and controlling the hypotheses table.
 */
export interface UseHypothesesTableComposable {
  columns: ComputedRef<TableColumn<HypothesisResponseDto>[]>
  sorting: Ref<Array<{ id: string, desc: boolean }>>
  priorityColor: (priority: HypothesisPriority) => 'error' | 'warning' | 'neutral'
  statusColor: (status: HypothesisUiStatus) => 'success' | 'error' | 'neutral'
  dimensionLabel: (dimension: HypothesisDimension) => string
  priorityLabel: (priority: HypothesisPriority) => string
  statusLabel: (status: HypothesisUiStatus) => string
  getHypothesisUiStatus: (hypothesis: HypothesisResponseDto) => HypothesisUiStatus
}

/**
 * Encapsulates all table-specific state, rendering helpers and row action wiring.
 */
export const useHypothesesTable = (
): UseHypothesesTableComposable => {
  const { t } = useI18n()
  const sorting = ref<Array<{ id: string, desc: boolean }>>([])

  const priorityColor = (priority: HypothesisPriority): 'error' | 'warning' | 'neutral' => {
    if (priority === 'HIGH') {
      return 'error'
    }

    if (priority === 'MEDIUM') {
      return 'warning'
    }

    return 'neutral'
  }

  const dimensionLabel = (dimension: HypothesisDimension): string => {
    return t(`ideaWorkspace.hypotheses.dimensions.${dimension}`)
  }

  const priorityLabel = (priority: HypothesisPriority): string => {
    return t(`ideaWorkspace.hypotheses.priorities.${priority}`)
  }

  const getHypothesisUiStatus = (hypothesis: HypothesisResponseDto): HypothesisUiStatus => {
    return hypothesis.status
  }

  const statusLabel = (status: HypothesisUiStatus): string => {
    return t(`ideaWorkspace.hypotheses.status.${status}`)
  }

  const statusColor = (status: HypothesisUiStatus): 'success' | 'error' | 'neutral' => {
    if (status === 'VALIDATED') {
      return 'success'
    }

    if (status === 'INVALIDATED') {
      return 'error'
    }

    return 'neutral'
  }

  const columns = computed<TableColumn<HypothesisResponseDto>[]>(() => [
    {
      accessorKey: 'statement',
      header: t('ideaWorkspace.hypotheses.table.columns.statement'),
      meta: {
        class: {
          th: 'w-auto md:w-[28rem] lg:w-[32rem]',
          td: 'w-auto md:w-[28rem] lg:w-[32rem] align-top whitespace-normal'
        }
      }
    },
    {
      accessorKey: 'dimension',
      sortingFn: (left, right) => {
        return dimensionLabel(left.original.dimension).localeCompare(dimensionLabel(right.original.dimension))
      },
      header: t('ideaWorkspace.hypotheses.table.columns.dimension'),
      meta: {
        class: {
          th: 'hidden md:table-cell md:w-44',
          td: 'hidden md:table-cell md:w-44'
        }
      }
    },
    {
      accessorKey: 'priority',
      sortingFn: (left, right) => {
        const priorityRank: Record<HypothesisPriority, number> = {
          HIGH: 3,
          MEDIUM: 2,
          LOW: 1
        }

        return priorityRank[left.original.priority] - priorityRank[right.original.priority]
      },
      header: t('ideaWorkspace.hypotheses.table.columns.priority'),
      meta: {
        class: {
          th: 'hidden md:table-cell md:w-36',
          td: 'hidden md:table-cell md:w-36'
        }
      }
    },
    {
      id: 'status',
      accessorFn: row => getHypothesisUiStatus(row),
      sortingFn: (left, right) => {
        const statusRank: Record<HypothesisUiStatus, number> = {
          VALIDATED: 3,
          INVALIDATED: 2,
          NOT_TESTED: 1
        }

        return statusRank[getHypothesisUiStatus(left.original)] - statusRank[getHypothesisUiStatus(right.original)]
      },
      header: t('ideaWorkspace.hypotheses.table.columns.status'),
      meta: {
        class: {
          th: 'hidden md:table-cell md:w-32',
          td: 'hidden md:table-cell md:w-32 align-middle'
        }
      }
    },
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      header: '',
      meta: {
        class: {
          th: 'w-12 md:w-16',
          td: 'w-12 md:w-16 text-right align-middle'
        }
      }
    }
  ])

  return {
    columns,
    sorting,
    priorityColor,
    statusColor,
    dimensionLabel,
    priorityLabel,
    statusLabel,
    getHypothesisUiStatus
  }
}
