import { prisma } from '@infrastructure/db/prisma'
import type { Prisma, IdeaVersionType } from '@generated/prisma/client'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { IdeaSummary } from '@application/models/idea-summary'

/**
 * Prisma payload used to materialize an idea together with its latest version.
 */
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

/**
 * Maps a Prisma idea row with its latest version to the existing summary model.
 */
const toIdeaSummary = (row: PrismaIdeaWithLatestVersion): IdeaSummary => {
  const latestVersion = row.versions[0]

  if (!latestVersion) {
    throw new Error(`Idea ${row.id} is missing its latest version.`)
  }

  return {
    id: row.id,
    userId: row.userId,
    title: latestVersion.title,
    description: latestVersion.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Builds the Prisma where clause for listing and searching a user's ideas.
 */
const buildIdeaWhere = (input: {
  userId: string
  search: string | null
}): Prisma.IdeaWhereInput => {
  if (!input.search) {
    return {
      userId: input.userId
    }
  }

  return {
    userId: input.userId,
    versions: {
      some: {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } }
        ]
      }
    }
  }
}

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
   * Persists a new idea and returns the mapped domain model.
   */
  async create(input: { userId: string, title: string, description: string | null }): Promise<IdeaSummary> {
    const row = await prisma.$transaction(async (tx) => {
      const idea = await tx.idea.create({
        data: {
          userId: input.userId
        }
      })

      await tx.ideaVersion.create({
        data: {
          ideaId: idea.id,
          versionNumber: 1,
          type: 'INITIAL' satisfies IdeaVersionType,
          title: input.title,
          description: input.description
        }
      })

      return tx.idea.findUniqueOrThrow({
        where: { id: idea.id },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      })
    })

    return toIdeaSummary(row)
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
  },

  /**
   * Returns a paginated list of a user's ideas together with the filtered total count.
   */
  async listByUserId(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: IdeaSummary[], total: number }> {
    const skip = (input.page - 1) * input.pageSize
    const where = buildIdeaWhere({
      userId: input.userId,
      search: input.search
    })

    const [rows, total] = await prisma.$transaction([
      prisma.idea.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        },
        skip,
        take: input.pageSize
      }),
      prisma.idea.count({ where })
    ])

    return {
      ideas: rows.map(toIdeaSummary),
      total
    }
  }
}
