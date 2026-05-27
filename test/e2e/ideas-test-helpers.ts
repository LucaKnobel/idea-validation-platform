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
  return prisma.$transaction(async (tx) => {
    const idea = await tx.idea.create({
      data: {
        userId: input.userId
      },
      select: {
        id: true,
        userId: true
      }
    })

    await tx.ideaVersion.create({
      data: {
        ideaId: idea.id,
        versionNumber: 1,
        type: 'INITIAL',
        title: input.title,
        description: input.description ?? null
      }
    })

    return idea
  })
}
