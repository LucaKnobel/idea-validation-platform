import type { Idea } from '@application/models/idea'

export interface IdeaVersionRepository {
  listIdeasByUser(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: Idea[], total: number }>
}
