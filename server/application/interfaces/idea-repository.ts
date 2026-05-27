import type { Idea } from '@application/models/idea'

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  create(input: { userId: string }): Promise<Idea>
  deleteByIdForUser(input: { userId: string, ideaId: string }): Promise<boolean>
}
