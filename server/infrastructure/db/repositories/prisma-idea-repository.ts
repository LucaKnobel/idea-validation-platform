import { prisma } from '@infrastructure/db/prisma'
import type { Idea as PrismaIdea } from '@generated/prisma/client'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Idea } from '@application/models/idea'

const toDomainIdea = (row: PrismaIdea): Idea => ({
  id: row.id,
  userId: row.userId,
  title: row.title,
  description: row.description,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

export const ideaRepository: IdeaRepository = {
  async countByUserId(userId: string): Promise<number> {
    return prisma.idea.count({
      where: { userId }
    })
  },

  async create(input: { userId: string, title: string, description: string | null }): Promise<Idea> {
    const row = await prisma.idea.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description
      }
    })

    return toDomainIdea(row)
  },

  async listByUserId(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: Idea[], total: number }> {
    const skip = (input.page - 1) * input.pageSize
    const where = input.search
      ? {
          userId: input.userId,
          OR: [
            { title: { contains: input.search, mode: 'insensitive' as const } },
            { description: { contains: input.search, mode: 'insensitive' as const } }
          ]
        }
      : {
          userId: input.userId
        }

    const [rows, total] = await prisma.$transaction([
      prisma.idea.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: input.pageSize
      }),
      prisma.idea.count({ where })
    ])

    return {
      ideas: rows.map(toDomainIdea),
      total
    }
  }
}
