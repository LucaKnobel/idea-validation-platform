import { ideaRepository } from '@infrastructure/db/repositories/prisma-idea-repository'
import { ideaVersionRepository } from '@infrastructure/db/repositories/prisma-idea-version-repository'
import { canvasRepository } from '@infrastructure/db/repositories/prisma-canvas-repository'
import { hypothesisRepository } from '@infrastructure/db/repositories/prisma-hypothesis-repository'
import { experimentRepository } from '@infrastructure/db/repositories/prisma-experiment-repository'
import { metricRepository } from '@infrastructure/db/repositories/prisma-metric-repository'
import { measurementRepository } from '@infrastructure/db/repositories/prisma-measurement-repository'
import { subscriptionRepository } from '@infrastructure/db/repositories/prisma-subscription-repository'
import { logger } from '@infrastructure/logging/logger'

import { createSubscriptionService } from '@application/services/subscription-service'
import { createCreateIdea } from '@application/services/create-idea'
import { createGetIdeas } from '@application/services/get-ideas'
import { createDeleteIdea } from '@application/services/delete-idea'
import { createGetIdeaVersionCanvas } from '@application/services/get-idea-version-canvas'
import { createUpdateIdeaVersionCanvas } from '@application/services/update-idea-version-canvas'
import { createCreateHypothesis } from '@application/services/create-hypothesis'
import { createGetIdeaVersionHypotheses } from '@application/services/get-idea-version-hypotheses'
import { createGetHypothesis } from '@application/services/get-hypothesis'
import { createUpdateHypothesis } from '@application/services/update-hypothesis'
import { createDeleteHypothesis } from '@application/services/delete-hypothesis'
import { createGetHypothesisMetrics } from '@application/services/get-hypothesis-metrics'
import { createCreateMetric } from '@application/services/create-metric'
import { createUpdateMetric } from '@application/services/update-metric'
import { createDeleteMetric } from '@application/services/delete-metric'
import { createGetHypothesisExperiments } from '@application/services/get-hypothesis-experiments'
import { createCreateExperiment } from '@application/services/create-experiment'
import { createUpdateExperiment } from '@application/services/update-experiment'
import { createDeleteExperiment } from '@application/services/delete-experiment'
import { createGetExperimentMeasurements } from '@application/services/get-experiment-measurements'
import { createCreateMeasurement } from '@application/services/create-measurement'
import { createUpdateMeasurement } from '@application/services/update-measurement'
import { createDeleteMeasurement } from '@application/services/delete-measurement'

/**
 * Central composition root for wiring repositories, infrastructure adapters, and use cases.
 */
const subscriptionService = createSubscriptionService(
  subscriptionRepository,
  logger
)

const createIdea = createCreateIdea(
  ideaRepository,
  subscriptionService,
  logger
)

const getIdeas = createGetIdeas(
  ideaVersionRepository,
  logger
)

const deleteIdea = createDeleteIdea(
  ideaRepository,
  logger
)

const getIdeaVersionCanvas = createGetIdeaVersionCanvas(
  canvasRepository,
  logger
)

const updateIdeaVersionCanvas = createUpdateIdeaVersionCanvas(
  canvasRepository,
  logger
)

const createHypothesis = createCreateHypothesis(
  hypothesisRepository,
  logger
)

const getIdeaVersionHypotheses = createGetIdeaVersionHypotheses(
  hypothesisRepository,
  logger
)

const getHypothesis = createGetHypothesis(
  hypothesisRepository,
  logger
)

const updateHypothesis = createUpdateHypothesis(
  hypothesisRepository,
  logger
)

const deleteHypothesis = createDeleteHypothesis(
  hypothesisRepository,
  logger
)

const getHypothesisMetrics = createGetHypothesisMetrics(
  metricRepository,
  logger
)

const createMetric = createCreateMetric(
  metricRepository,
  logger
)

const updateMetric = createUpdateMetric(
  metricRepository,
  logger
)

const deleteMetric = createDeleteMetric(
  metricRepository,
  logger
)

const getHypothesisExperiments = createGetHypothesisExperiments(
  experimentRepository,
  logger
)

const createExperiment = createCreateExperiment(
  experimentRepository,
  logger
)

const updateExperiment = createUpdateExperiment(
  experimentRepository,
  logger
)

const deleteExperiment = createDeleteExperiment(
  experimentRepository,
  logger
)

const getExperimentMeasurements = createGetExperimentMeasurements(
  measurementRepository,
  logger
)

const createMeasurement = createCreateMeasurement(
  measurementRepository,
  logger
)

const updateMeasurement = createUpdateMeasurement(
  measurementRepository,
  logger
)

const deleteMeasurement = createDeleteMeasurement(
  measurementRepository,
  logger
)

export {
  subscriptionService,
  createIdea,
  getIdeas,
  deleteIdea,
  getIdeaVersionCanvas,
  updateIdeaVersionCanvas,
  createHypothesis,
  getIdeaVersionHypotheses,
  getHypothesis,
  updateHypothesis,
  deleteHypothesis,
  getHypothesisMetrics,
  createMetric,
  updateMetric,
  deleteMetric,
  getHypothesisExperiments,
  createExperiment,
  updateExperiment,
  deleteExperiment,
  getExperimentMeasurements,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement
}
