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
 * Represents one persisted hypothesis in a specific idea version.
 */
export type Hypothesis = {
  id: string
  ideaVersionId: string
  statement: string
  dimension: HypothesisDimension
  priority: HypothesisPriority
  canvasSectionLinks: HypothesisCanvasSection[]
  createdAt: Date
  updatedAt: Date
}
