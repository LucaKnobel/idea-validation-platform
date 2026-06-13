import { prisma } from '@infrastructure/db/prisma'
import type {
  HypothesisCreateFieldsInput,
  HypothesisRepository,
  HypothesisUpdateFieldsInput
} from '@application/interfaces/hypothesis-repository'
import type { Hypothesis } from '@application/models/hypothesis'
import type { Prisma } from '@generated/prisma/client'
import type { HypothesisOwnerInput } from '@application/interfaces/ownership-inputs'
import {
  buildOwnedHypothesisWhere,
  buildOwnedHypothesesByIdeaVersionWhere,
  isIdeaVersionOwnedByUser
} from '@infrastructure/db/ownership-helpers'

type PrismaHypothesisWithSections = Prisma.HypothesisGetPayload<{
  include: {
    canvasSectionLinks: {
      orderBy: {
        canvasElementType: 'asc'
      }
    }
  }
}>

const toDomainHypothesis = (row: PrismaHypothesisWithSections): Hypothesis => {
  return {
    id: row.id,
    ideaVersionId: row.ideaVersionId,
    statement: row.statement,
    dimension: row.dimension,
    priority: row.priority,
    canvasSectionLinks: row.canvasSectionLinks.map(section => ({
      id: section.id,
      hypothesisId: section.hypothesisId,
      canvasElementType: section.canvasElementType,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt
    })),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Prisma-backed implementation of the hypothesis repository contract.
 */
export const hypothesisRepository: HypothesisRepository = {
  /**
   * Lists all hypotheses for a user-owned idea version.
   */
  async listByIdeaVersionForUser(input: HypothesisOwnerInput): Promise<Hypothesis[] | null> {
    const hasAccess = await isIdeaVersionOwnedByUser(input)

    if (!hasAccess) {
      return null
    }

    const rows = await prisma.hypothesis.findMany({
      where: buildOwnedHypothesesByIdeaVersionWhere(input),
      orderBy: [
        { createdAt: 'asc' }
      ],
      include: {
        canvasSectionLinks: {
          orderBy: {
            canvasElementType: 'asc'
          }
        }
      }
    })

    return rows.map(toDomainHypothesis)
  },

  /**
   * Returns one hypothesis for a user-owned idea version.
   */
  async getByIdForUser(input: HypothesisOwnerInput): Promise<Hypothesis | null> {
    const row = await prisma.hypothesis.findFirst({
      where: buildOwnedHypothesisWhere(input),
      include: {
        canvasSectionLinks: {
          orderBy: {
            canvasElementType: 'asc'
          }
        }
      }
    })

    if (row === null) {
      return null
    }

    return toDomainHypothesis(row)
  },

  /**
   * Creates one hypothesis for a user-owned idea version.
   */
  async createForIdeaVersion(input: HypothesisOwnerInput & HypothesisCreateFieldsInput): Promise<Hypothesis | null> {
    const hasAccess = await isIdeaVersionOwnedByUser(input)

    if (!hasAccess) {
      return null
    }

    const row = await prisma.hypothesis.create({
      data: {
        ideaVersionId: input.ideaVersionId,
        statement: input.statement,
        dimension: input.dimension,
        priority: input.priority,
        evidenceType: input.evidenceType,
        canvasSectionLinks: {
          create: input.canvasSectionTypes.map(canvasElementType => ({
            canvasElementType
          }))
        }
      },
      include: {
        canvasSectionLinks: {
          orderBy: {
            canvasElementType: 'asc'
          }
        }
      }
    })

    return toDomainHypothesis(row)
  },

  /**
   * Updates one hypothesis and replaces its section links.
   */
  async updateByIdForUser(input: HypothesisOwnerInput & HypothesisUpdateFieldsInput): Promise<Hypothesis | null> {
    const where = buildOwnedHypothesisWhere(input)

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRows = await tx.hypothesis.updateMany({
        where,
        data: {
          statement: input.statement,
          dimension: input.dimension,
          priority: input.priority
        }
      })

      if (updatedRows.count === 0) {
        return null
      }

      await tx.hypothesisCanvasSection.deleteMany({
        where: {
          hypothesisId: input.hypothesisId
        }
      })

      if (input.canvasSectionTypes.length > 0) {
        await tx.hypothesisCanvasSection.createMany({
          data: input.canvasSectionTypes.map(canvasElementType => ({
            hypothesisId: input.hypothesisId,
            canvasElementType
          }))
        })
      }

      return tx.hypothesis.findFirst({
        where,
        include: {
          canvasSectionLinks: {
            orderBy: {
              canvasElementType: 'asc'
            }
          }
        }
      })
    })

    if (updated === null) {
      return null
    }

    return toDomainHypothesis(updated)
  },

  /**
   * Deletes one hypothesis for a user and returns whether a row was removed.
   */
  async deleteByIdForUser(
    input: HypothesisOwnerInput
  ): Promise<boolean> {
    const result = await prisma.hypothesis.deleteMany({
      where: buildOwnedHypothesisWhere(input)
    })

    return result.count > 0
  }
}
