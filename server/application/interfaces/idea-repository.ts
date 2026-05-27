import type { IdeaSummary } from '@application/models/idea-summary'

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  create(input: { userId: string, title: string, description: string | null }): Promise<IdeaSummary>
  deleteByIdForUser(input: { userId: string, ideaId: string }): Promise<boolean>
  listByUserId(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: IdeaSummary[], total: number }>
}
