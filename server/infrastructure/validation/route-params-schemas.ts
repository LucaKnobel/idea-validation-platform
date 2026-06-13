import * as z from 'zod'

/**
 * Shared UUID primitive for route parameters that identify a single resource.
 */
const UuidSchema = z.uuid()

/**
 * Route params for endpoints addressing a single idea by ID.
 */
export const IdeaIdParamsSchema = z.object({
  ideaId: UuidSchema
})

/**
 * Route params for endpoints scoped to a single idea version.
 */
export const IdeaVersionIdRouteParamsSchema = z.object({
  versionId: UuidSchema
})

/**
 * Route params for endpoints addressing a single hypothesis.
 */
export const HypothesisIdRouteParamsSchema = z.object({
  hypothesisId: UuidSchema
})

/**
 * Route params for endpoints addressing a single experiment.
 */
export const ExperimentIdRouteParamsSchema = z.object({
  experimentId: UuidSchema
})

/**
 * Route params for endpoints addressing a single metric.
 */
export const MetricIdRouteParamsSchema = z.object({
  metricId: UuidSchema
})

/**
 * Route params for endpoints addressing a single measurement.
 */
export const MeasurementIdRouteParamsSchema = z.object({
  measurementId: UuidSchema
})

export type IdeaIdParamsDto = z.infer<typeof IdeaIdParamsSchema>
export type IdeaVersionIdRouteParamsDto = z.infer<typeof IdeaVersionIdRouteParamsSchema>
export type HypothesisIdRouteParamsDto = z.infer<typeof HypothesisIdRouteParamsSchema>
export type ExperimentIdRouteParamsDto = z.infer<typeof ExperimentIdRouteParamsSchema>
export type MetricIdRouteParamsDto = z.infer<typeof MetricIdRouteParamsSchema>
export type MeasurementIdRouteParamsDto = z.infer<typeof MeasurementIdRouteParamsSchema>
