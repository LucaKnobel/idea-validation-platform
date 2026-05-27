import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'

export interface IdeaVersionRepository {
  createInitial(input: { ideaId: string, title: string, description: string | null }): Promise<IdeaVersion>
  listIdeasByUser(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: Idea[], total: number }>
}
