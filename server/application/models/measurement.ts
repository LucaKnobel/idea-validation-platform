/**
 * Represents one persisted measurement singleton in a specific hypothesis.
 */
export type Measurement = {
  id: string
  hypothesisId: string
  value: number
  note: string | null
  createdAt: Date
  updatedAt: Date
}
