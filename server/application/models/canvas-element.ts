/**
 * Supported business model canvas sections.
 */
export const canvasElementTypes = [
  'CUSTOMER_SEGMENTS',
  'VALUE_PROPOSITIONS',
  'CHANNELS',
  'CUSTOMER_RELATIONSHIPS',
  'REVENUE_STREAMS',
  'KEY_RESOURCES',
  'KEY_ACTIVITIES',
  'KEY_PARTNERS',
  'COST_STRUCTURE'
] as const

/**
 * Union type for supported business model canvas section identifiers.
 */
export type CanvasElementType = (typeof canvasElementTypes)[number]

/**
 * Represents a persisted business model canvas entry in a specific idea version.
 */
export type CanvasElement = {
  id: string
  ideaVersionId: string
  type: CanvasElementType
  content: string
  createdAt: Date
  updatedAt: Date
}
