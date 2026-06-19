export type IdeaVersionType = 'INITIAL' | 'ITERATION' | 'PIVOT'

/**
 * Represents a persisted version of an idea's content.
 */
export type IdeaVersion = {
  id: string
  ideaId: string
  parentVersionId: string | null
  versionNumber: number
  type: IdeaVersionType
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}
