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
  countByUser(userId: string): Promise<number>
  create(input: IdeaCreateInput): Promise<Idea>
  delete(input: IdeaDeleteInput): Promise<boolean>
}
