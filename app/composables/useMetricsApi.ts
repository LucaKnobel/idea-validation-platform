import type {
  CreateMetricBodyDto,
  MetricResponseDto,
  MetricsListResponseDto,
  UpdateMetricBodyDto
} from '#shared/types/metric'

/**
 * Public contract implemented by useMetricsApi.
 */
export interface UseMetricsApiComposable {
  listMetrics: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }) => Promise<MetricsListResponseDto>
  createMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: CreateMetricBodyDto
  }) => Promise<MetricResponseDto>
  updateMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
    body: UpdateMetricBodyDto
  }) => Promise<MetricResponseDto>
  deleteMetric: (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
  }) => Promise<void>
}

/**
 * Encapsulates HTTP calls for hypothesis metric resources.
 */
export const useMetricsApi = (): UseMetricsApiComposable => {
  const listMetrics = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
  }): Promise<MetricsListResponseDto> => {
    return $fetch<MetricsListResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics`)
  }

  const createMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    body: CreateMetricBodyDto
  }): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics`, {
      method: 'POST',
      body: input.body
    })
  }

  const updateMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
    body: UpdateMetricBodyDto
  }): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/ideas/${input.ideaId}/versions/${input.versionId}/hypotheses/${input.hypothesisId}/metrics/${input.metricId}`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMetric = async (input: {
    ideaId: string
    versionId: string
    hypothesisId: string
    metricId: string
  }): Promise<void> => {
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
