import { prisma } from '@infrastructure/db/prisma'

export type CreateIdeaForUserInput = {
  userId: string
  title: string
  description?: string | null
}

export const createIdeaForUser = async (input: CreateIdeaForUserInput) => {
  return prisma.idea.create({
    data: {
      userId: input.userId,
      title: input.title,
      description: input.description ?? null
    },
    select: {
      id: true,
      userId: true
    }
  })
}
