import type {
  HypothesisDimension
} from './hypothesis'

/**
 * Aggregated hypothesis counts grouped by derived validation status.
 * Used to describe how much of one idea version is validated, invalidated, or still untested.
 */
export type ValidationStatusCounts = {
  validated: number
  invalidated: number
  notTested: number
}

/**
 * Aggregated hypothesis counts grouped by prioritization level.
 * Used to show where the most critical validation work is concentrated.
 */
export type ValidationPriorityCounts = {
  high: number
  medium: number
  low: number
}

/**
 * Aggregated hypothesis counts grouped by evidence type.
 * Used to visualize which validation methods are currently represented in one idea version.
 */
export type ValidationEvidenceCounts = {
  qualitative: number
  quantitative: number
  behavioral: number
  monetary: number
}

/**
 * Validation summary for a single hypothesis dimension.
 * This powers per-dimension dashboard cards such as Problem, Solution, or Market.
 */
export type IdeaVersionValidationOverviewDimensionCard = {
  dimension: HypothesisDimension
  statusCounts: ValidationStatusCounts
  priorityCounts: ValidationPriorityCounts
  evidenceCounts: ValidationEvidenceCounts
}

/**
 * Aggregated validation summary for one idea version.
 * This is the backend-facing domain model behind the validation dashboard endpoint.
 */
export type IdeaVersionValidationOverview = {
  ideaId: string
  ideaVersionId: string
  totalHypotheses: number
  statusCounts: ValidationStatusCounts
  priorityCounts: ValidationPriorityCounts
  evidenceCounts: ValidationEvidenceCounts
  dimensionCards: IdeaVersionValidationOverviewDimensionCard[]
}
