import { prisma } from '@infrastructure/db/prisma'
import type { Prisma, IdeaVersionType } from '@generated/prisma/client'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'

type PrismaIdeaWithVersions = Prisma.IdeaGetPayload<{
  include: {
    versions: {
      orderBy: {
        versionNumber: 'desc'
      }
    }
  }
}>

const toDomainIdea = (row: PrismaIdeaWithVersions): Idea => {
  return {
    id: row.id,
    userId: row.userId,
    versions: row.versions.map(version => ({
      id: version.id,
      ideaId: version.ideaId,
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

const toDomainVersion = (row: {
  id: string
  ideaId: string
  versionNumber: number
  type: IdeaVersionType
  title: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}): IdeaVersion => {
  return {
    id: row.id,
    ideaId: row.ideaId,
    versionNumber: row.versionNumber,
    type: row.type,
    title: row.title,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

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

export const ideaVersionRepository: IdeaVersionRepository = {
  async createInitial(input: {
    ideaId: string
    title: string
    description: string | null
  }): Promise<IdeaVersion> {
    const row = await prisma.ideaVersion.create({
      data: {
        ideaId: input.ideaId,
        versionNumber: 1,
        type: 'INITIAL' satisfies IdeaVersionType,
        title: input.title,
        description: input.description
      }
    })

    return toDomainVersion(row)
  },

  async listIdeasByUser(input: {
    userId: string
    search: string | null
    page: number
    pageSize: number
  }): Promise<{ ideas: Idea[], total: number }> {
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
            orderBy: { versionNumber: 'desc' }
          }
        },
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
