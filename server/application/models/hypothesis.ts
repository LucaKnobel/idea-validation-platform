import type { HypothesisCanvasSection } from './hypothesis-canvas-section'

/**
 * Supported uncertainty dimensions used to classify one hypothesis.
 */
export const hypothesisDimensions = [
  'PROBLEM',
  'SOLUTION',
  'MARKET',
  'MONETIZATION',
  'EXECUTION'
] as const

/**
 * Union type for supported uncertainty dimensions.
 */
export type HypothesisDimension = (typeof hypothesisDimensions)[number]

/**
 * Supported priority levels used to weight one hypothesis.
 */
export const hypothesisPriorities = [
  'HIGH',
  'MEDIUM',
  'LOW'
] as const

/**
 * Union type for supported hypothesis priorities.
 */
export type HypothesisPriority = (typeof hypothesisPriorities)[number]

/**
 * Supported evidence types used to classify one hypothesis.
 */
export const hypothesisEvidenceTypes = [
  'QUALITATIVE',
  'QUANTITATIVE',
  'BEHAVIORAL',
  'MONETARY'
] as const

/**
 * Union type for supported evidence types.
 */
export type HypothesisEvidenceType = (typeof hypothesisEvidenceTypes)[number]

/**
 * Supported lifecycle states for one hypothesis.
 */
export const hypothesisStatuses = [
  'NOT_TESTED',
  'VALIDATED',
  'INVALIDATED'
] as const

/**
 * Union type for supported hypothesis statuses.
 */
export type HypothesisStatus = (typeof hypothesisStatuses)[number]

/**
 * Represents one persisted hypothesis in a specific idea version.
 */
export type Hypothesis = {
  id: string
  ideaVersionId: string
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  evidenceType: HypothesisEvidenceType
  status: HypothesisStatus
  canvasSectionLinks: HypothesisCanvasSection[]
  createdAt: Date
  updatedAt: Date
}
