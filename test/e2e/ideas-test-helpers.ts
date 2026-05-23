import { prisma } from '@infrastructure/db/prisma'

/**
 * Input contract for creating fixture ideas owned by a specific user.
 */
export type CreateIdeaForUserInput = {
  userId: string
  title: string
  description?: string | null
}

/**
 * Creates an idea fixture and returns only identifiers needed by tests.
 */
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
