/**
 * Represents the idea data returned by the existing ideas API.
 */
export type IdeaSummary = {
  id: string
  userId: string
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}
