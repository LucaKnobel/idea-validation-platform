import type {
  CreateMetricBodyDto,
  MetricResponseDto,
  MetricsListResponseDto,
  UpdateMetricBodyDto
} from '#shared/types/metric'

export interface ListMetricsInput {
  ideaId: string
  versionId: string
  hypothesisId: string
}

export interface CreateMetricInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  body: CreateMetricBodyDto
}

export interface UpdateMetricInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  metricId: string
  body: UpdateMetricBodyDto
}

export interface DeleteMetricInput {
  ideaId: string
  versionId: string
  hypothesisId: string
  metricId: string
}

/**
 * Public contract implemented by useMetricsApi.
 */
export interface UseMetricsApiComposable {
  listMetrics: (input: ListMetricsInput) => Promise<MetricsListResponseDto>
  createMetric: (input: CreateMetricInput) => Promise<MetricResponseDto>
  updateMetric: (input: UpdateMetricInput) => Promise<MetricResponseDto>
  deleteMetric: (input: DeleteMetricInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for hypothesis metric resources.
 */
export const useMetricsApi = (): UseMetricsApiComposable => {
  const listMetrics = async (input: ListMetricsInput): Promise<MetricsListResponseDto> => {
    return $fetch<MetricsListResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics`)
  }

  const createMetric = async (input: CreateMetricInput): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateMetric = async (input: UpdateMetricInput): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics/${input.metricId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMetric = async (input: DeleteMetricInput): Promise<void> => {
    await $fetch(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics/${input.metricId}`, {
      method: 'DELETE'
    })
  }

  return {
    listMetrics,
    createMetric,
    updateMetric,
    deleteMetric
  }
}
