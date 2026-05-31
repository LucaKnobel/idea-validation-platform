import type { Idea } from '@application/models/idea'

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  createWithInitialVersion(input: {
    userId: string
    title: string
    description: string | null
  }): Promise<Idea>
  deleteByIdForUser(input: { userId: string, ideaId: string }): Promise<boolean>
}
