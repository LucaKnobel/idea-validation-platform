import type { Idea } from '@application/models/idea'

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  create(input: { userId: string, title: string, description: string | null }): Promise<Idea>
  deleteByIdForUser(input: { userId: string, ideaId: string }): Promise<boolean>
  listByUserId(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: Idea[], total: number }>
}
