import { prisma } from '@infrastructure/db/prisma'
import type { Prisma, CanvasElement as PrismaCanvasElement } from '@generated/prisma/client'
import type { CanvasReplaceInput, CanvasRepository } from '@application/interfaces/canvas-repository'
import type { CanvasElement, CanvasElementType } from '@application/models/canvas-element'
import type { IdeaVersionOwnerInput } from '@application/interfaces/ownership-inputs'
import { isIdeaVersionOwnedByUser } from '@infrastructure/db/ownership-helpers'

/**
 * Maps a Prisma canvas element row into the application domain model.
 */
const toDomainCanvasElement = (row: PrismaCanvasElement): CanvasElement => {
  return {
    id: row.id,
    ideaVersionId: row.ideaVersionId,
    type: row.type,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Builds an ownership filter for canvas entries belonging to a specific idea version.
 */
const buildOwnedCanvasElementWhere = (input: IdeaVersionOwnerInput): Prisma.CanvasElementWhereInput => {
  return {
    ideaVersionId: input.ideaVersionId,
    ideaVersion: {
      ideaId: input.ideaId,
      idea: {
        userId: input.userId
      }
    }
  }
}

/**
 * Lists all owned canvas entries for a specific idea version in a stable display order.
 */
const listOwnedCanvasElements = async (input: IdeaVersionOwnerInput): Promise<CanvasElement[]> => {
  const rows = await prisma.canvasElement.findMany({
    where: buildOwnedCanvasElementWhere(input),
    orderBy: [
      { type: 'asc' },
      { createdAt: 'asc' }
    ]
  })

  return rows.map(toDomainCanvasElement)
}

/**
 * Prisma-backed implementation of the canvas repository contract.
 */
export const canvasRepository: CanvasRepository = {
  /**
   * Loads the persisted canvas entries for a user-owned idea version.
   */
  async getByIdeaVersionForUser(input: IdeaVersionOwnerInput): Promise<CanvasElement[] | null> {
    const hasAccess = await isIdeaVersionOwnedByUser(input)

    if (!hasAccess) {
      return null
    }

    return listOwnedCanvasElements(input)
  },

  /**
   * Replaces the complete canvas snapshot for a user-owned idea version inside one transaction.
   */
  async replaceByIdeaVersionForUser(input: CanvasReplaceInput): Promise<CanvasElement[] | null> {
    const hasAccess = await isIdeaVersionOwnedByUser(input)

    if (!hasAccess) {
      return null
    }

    await prisma.$transaction(async (tx) => {
      await tx.canvasElement.deleteMany({
        where: buildOwnedCanvasElementWhere(input)
      })

      if (input.elements.length > 0) {
        await tx.canvasElement.createMany({
          data: input.elements.map(element => ({
            ideaVersionId: input.ideaVersionId,
            type: element.type,
            content: element.content
          }))
        })
      }
    })

    return listOwnedCanvasElements(input)
  }
}
