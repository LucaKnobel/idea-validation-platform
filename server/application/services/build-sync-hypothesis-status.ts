import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { MeasurementRepository } from '@application/interfaces/measurement-repository'
import type { MetricRepository } from '@application/interfaces/metric-repository'
import type { ExperimentStatus } from '@application/models/experiment'
import type { Hypothesis, HypothesisStatus } from '@application/models/hypothesis'
import type { MetricThreshold, ThresholdOperator } from '@application/models/metric-threshold'
import type { Logger } from '@interfaces/logger'

export type SyncHypothesisStatusInput = {
  userId: string
  hypothesisId: string
}

export type DeriveHypothesisStatusInput = {
  experimentStatus: ExperimentStatus | null
  threshold: MetricThreshold | null
  measurementValue: number | null
}

const satisfiesThreshold = (threshold: MetricThreshold, measurementValue: number): boolean => {
  const thresholdOperator: ThresholdOperator = threshold.operator

  switch (thresholdOperator) {
    case 'GTE':
      return measurementValue >= threshold.referenceValue
    case 'GT':
      return measurementValue > threshold.referenceValue
    case 'LTE':
      return measurementValue <= threshold.referenceValue
    case 'LT':
      return measurementValue < threshold.referenceValue
    case 'EQ':
      return measurementValue === threshold.referenceValue
  }
}

export const deriveHypothesisStatus = (input: DeriveHypothesisStatusInput): HypothesisStatus => {
  if (input.experimentStatus !== 'COMPLETED') {
    return 'NOT_TESTED'
  }

  if (input.threshold === null || input.measurementValue === null) {
    return 'NOT_TESTED'
  }

  return satisfiesThreshold(input.threshold, input.measurementValue)
    ? 'VALIDATED'
    : 'INVALIDATED'
}

/**
 * Builds the use case that recalculates and persists the derived status of one owned hypothesis.
 */
export const buildSyncHypothesisStatus = (
  hypothesisRepository: HypothesisRepository,
  experimentRepository: ExperimentRepository,
  metricRepository: MetricRepository,
  measurementRepository: MeasurementRepository,
  logger: Logger
) => {
  return async (input: SyncHypothesisStatusInput): Promise<Hypothesis> => {
    const existingHypothesis = await hypothesisRepository.getById({
      userId: input.userId,
      hypothesisId: input.hypothesisId
    })

    if (existingHypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    const [experiment, metric, measurement] = await Promise.all([
      experimentRepository.getByHypothesis({
        userId: input.userId,
        hypothesisId: input.hypothesisId
      }),
      metricRepository.getByHypothesis({
        userId: input.userId,
        hypothesisId: input.hypothesisId
      }),
      measurementRepository.getByHypothesis({
        userId: input.userId,
        hypothesisId: input.hypothesisId
      })
    ])

    const nextStatus = deriveHypothesisStatus({
      experimentStatus: experiment?.status ?? null,
      threshold: metric?.threshold ?? null,
      measurementValue: measurement?.value ?? null
    })

    if (nextStatus === existingHypothesis.status) {
      return existingHypothesis
    }

    const updatedHypothesis = await hypothesisRepository.updateStatus({
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      status: nextStatus
    })

    if (updatedHypothesis === null) {
      throw new HypothesisNotFoundError()
    }

    logger.debug('Hypothesis status synced', {
      userId: input.userId,
      hypothesisId: input.hypothesisId,
      previousStatus: existingHypothesis.status,
      nextStatus
    })

    return updatedHypothesis
  }
}
