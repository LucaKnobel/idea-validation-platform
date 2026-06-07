export type IdeaVersionOwnerInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

export type HypothesisOwnerInput = IdeaVersionOwnerInput & {
  hypothesisId: string
}

export type MetricOwnerInput = HypothesisOwnerInput & {
  metricId: string
}

export type ExperimentOwnerInput = HypothesisOwnerInput & {
  experimentId: string
}

export type MeasurementOwnerInput = ExperimentOwnerInput & {
  measurementId: string
}
