import type { CanvasElementType } from '@application/models/canvas-element'

/**
 * Represents one persisted link between a hypothesis and one canvas section type.
 */
export type HypothesisCanvasSection = {
  id: string
  hypothesisId: string
  canvasElementType: CanvasElementType
  createdAt: Date
  updatedAt: Date
}
