import type { Idea } from '@application/models/idea'

export type IdeaCreateInput = {
  userId: string
  title: string
  description: string | null
}

export type IdeaDeleteInput = {
  userId: string
  ideaId: string
}

export interface IdeaRepository {
  countByUserId(userId: string): Promise<number>
  createWithInitialVersion(input: IdeaCreateInput): Promise<Idea>
  deleteByIdForUser(input: IdeaDeleteInput): Promise<boolean>
}
