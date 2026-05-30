import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'

/**
 * Builds a Prisma where filter that constrains an idea version to its owning user.
 */
export const buildOwnedIdeaVersionWhere = (input: {
  userId: string
  ideaId: string
  ideaVersionId: string
}): Prisma.IdeaVersionWhereInput => {
  return {
    id: input.ideaVersionId,
    ideaId: input.ideaId,
    idea: {
      userId: input.userId
    }
  }
}

/**
 * Returns true when the given idea version belongs to the given user.
 */
export const isIdeaVersionOwnedByUser = async (input: {
  userId: string
  ideaId: string
  ideaVersionId: string
}): Promise<boolean> => {
  const row = await prisma.ideaVersion.findFirst({
    where: buildOwnedIdeaVersionWhere(input),
    select: { id: true }
  })

  return row !== null
}
