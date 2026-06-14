export interface GetMetricInput {
  hypothesisId: string
}

export interface UpsertMetricInput {
  hypothesisId: string
  body: UpsertMetricBodyDto
}

export interface DeleteMetricInput {
  hypothesisId: string
}

/**
 * Public contract implemented by useMetricsApi.
 */
export interface UseMetricsApiComposable {
  getMetric: (input: GetMetricInput) => Promise<MetricResponseDto>
  upsertMetric: (input: UpsertMetricInput) => Promise<MetricResponseDto>
  deleteMetric: (input: DeleteMetricInput) => Promise<void>
}

/**
 * Encapsulates HTTP calls for hypothesis metric resources.
 */
export const useMetricsApi = (): UseMetricsApiComposable => {
  const getMetric = async (input: GetMetricInput): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/hypotheses/${input.hypothesisId}/metric`)
  }

  const upsertMetric = async (input: UpsertMetricInput): Promise<MetricResponseDto> => {
    return $fetch<MetricResponseDto>(`/api/hypotheses/${input.hypothesisId}/metric`, {
      method: 'PUT',
      body: input.body
    })
  }

  const deleteMetric = async (input: DeleteMetricInput): Promise<void> => {
    await $fetch(`/api/hypotheses/${input.hypothesisId}/metric`, {
      method: 'DELETE'
    })
  }

  return {
    getMetric,
    upsertMetric,
    deleteMetric
  }
}
