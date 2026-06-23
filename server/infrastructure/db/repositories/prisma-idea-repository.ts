import { prisma } from '@infrastructure/db/prisma'
import type { IdeaCreateInput, IdeaDeleteInput, IdeaRepository } from '@application/interfaces/idea-repository'
import type { Prisma } from '@generated/prisma/client'
import type { Idea } from '@application/models/idea'
import { buildOwnedIdeaWhere } from '@infrastructure/db/ownership-helpers'

type PrismaIdeaWithLatestVersion = Prisma.IdeaGetPayload<{
  include: {
    versions: {
      orderBy: {
        versionNumber: 'desc'
      }
      take: 1
    }
  }
}>

const toDomainIdea = (row: PrismaIdeaWithLatestVersion): Idea => {
  return {
    id: row.id,
    userId: row.userId,
    versions: row.versions.map(version => ({
      id: version.id,
      ideaId: version.ideaId,
      parentVersionId: version.parentVersionId,
      versionNumber: version.versionNumber,
      type: version.type,
      title: version.title,
      description: version.description,
      createdAt: version.createdAt,
      updatedAt: version.updatedAt
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

export const ideaRepository: IdeaRepository = {
  /**
   * Counts all ideas owned by a user.
   */
  async countByUser(userId: string): Promise<number> {
    return prisma.idea.count({
      where: { userId }
    })
  },

  /**
   * Atomically creates an idea and its initial version.
   */
  async create(input: IdeaCreateInput): Promise<Idea> {
    const row = await prisma.idea.create({
      data: {
        userId: input.userId,
        versions: {
          create: {
            versionNumber: 1,
            type: 'INITIAL',
            title: input.title,
            description: input.description
          }
        }
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    })

    return toDomainIdea(row)
  },

  /**
   * Deletes an idea for a user and returns whether a row was removed.
   */
  async delete(input: IdeaDeleteInput): Promise<boolean> {
    const result = await prisma.idea.deleteMany({
      where: buildOwnedIdeaWhere(input)
    })

    return result.count > 0
  }
}
