import type { IdeaVersionValidationOverviewResponseDto } from '#shared/types/validation'

type ValidationStatusItem = {
  key: 'validated' | 'invalidated' | 'notTested'
  value: number
  color: 'success' | 'error' | 'neutral'
}

type ValidationPriorityItem = {
  key: 'high' | 'medium' | 'low'
  value: number
  color: 'error' | 'warning' | 'success'
}

type ValidationEvidenceItem = {
  key: 'qualitative' | 'quantitative' | 'behavioral' | 'monetary'
  value: number
}

/**
 * Input contract for deriving validation overview UI collections.
 */
export interface UseValidationOverviewInput {
  validationSummary: Ref<IdeaVersionValidationOverviewResponseDto | null>
}

/**
 * Public contract for derived validation overview UI collections.
 */
export interface UseValidationOverviewComposable {
  statusItems: ComputedRef<ValidationStatusItem[]>
  priorityItems: ComputedRef<ValidationPriorityItem[]>
  evidenceItems: ComputedRef<ValidationEvidenceItem[]>
  hasSummaryData: ComputedRef<boolean>
}

/**
 * Maps validation summary DTO data into presentation-focused collections.
 */
export const useValidationOverview = (input: UseValidationOverviewInput): UseValidationOverviewComposable => {
  const { validationSummary } = input

  const statusItems = computed(() => {
    if (!validationSummary.value) {
      return []
    }

    return [
      {
        key: 'validated',
        value: validationSummary.value.statusCounts.validated,
        color: 'success'
      },
      {
        key: 'invalidated',
        value: validationSummary.value.statusCounts.invalidated,
        color: 'error'
      },
      {
        key: 'notTested',
        value: validationSummary.value.statusCounts.notTested,
        color: 'neutral'
      }
    ] satisfies ValidationStatusItem[]
  })

  const priorityItems = computed(() => {
    if (!validationSummary.value) {
      return []
    }

    return [
      {
        key: 'high',
        value: validationSummary.value.priorityCounts.high,
        color: 'error'
      },
      {
        key: 'medium',
        value: validationSummary.value.priorityCounts.medium,
        color: 'warning'
      },
      {
        key: 'low',
        value: validationSummary.value.priorityCounts.low,
        color: 'success'
      }
    ] satisfies ValidationPriorityItem[]
  })

  const evidenceItems = computed(() => {
    if (!validationSummary.value) {
      return []
    }

    return [
      {
        key: 'qualitative',
        value: validationSummary.value.evidenceCounts.qualitative
      },
      {
        key: 'quantitative',
        value: validationSummary.value.evidenceCounts.quantitative
      },
      {
        key: 'behavioral',
        value: validationSummary.value.evidenceCounts.behavioral
      },
      {
        key: 'monetary',
        value: validationSummary.value.evidenceCounts.monetary
      }
    ] satisfies ValidationEvidenceItem[]
  })

  const hasSummaryData = computed(() => {
    return (validationSummary.value?.totalHypotheses ?? 0) > 0
  })

  return {
    statusItems,
    priorityItems,
    evidenceItems,
    hasSummaryData
  }
}
