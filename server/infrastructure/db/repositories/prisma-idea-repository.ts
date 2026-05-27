import { prisma } from '@infrastructure/db/prisma'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'

export const ideaRepository: IdeaRepository = {
  /**
   * Counts all ideas owned by a user.
   */
  async countByUserId(userId: string): Promise<number> {
    return prisma.idea.count({
      where: { userId }
    })
  },

  /**
   * Persists a new idea root and returns the mapped domain model.
   */
  async create(input: { userId: string }): Promise<Idea> {
    const row = await prisma.idea.create({
      data: {
        userId: input.userId
      }
    })

    return {
      id: row.id,
      userId: row.userId,
      versions: [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  },

  /**
   * Deletes an idea for a user and returns whether a row was removed.
   */
  async deleteByIdForUser(input: { userId: string, ideaId: string }): Promise<boolean> {
    const result = await prisma.idea.deleteMany({
      where: {
        id: input.ideaId,
        userId: input.userId
      }
    })

    return result.count > 0
  }
}
