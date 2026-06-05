import type { Idea } from '@application/models/idea'

export type IdeaVersionListInput = {
  userId: string
  search: string | null
  page: number
  pageSize: number
}

export interface IdeaVersionRepository {
  listIdeasByUser(input: IdeaVersionListInput): Promise<{ ideas: Idea[], total: number }>
}
