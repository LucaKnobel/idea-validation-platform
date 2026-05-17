import type { Idea } from '@application/models/idea'

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  create(input: { userId: string, title: string, description: string | null }): Promise<Idea>
}
