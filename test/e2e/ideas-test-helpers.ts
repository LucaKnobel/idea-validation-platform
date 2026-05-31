import { prisma } from '@infrastructure/db/prisma'
import type { CanvasElementType, IdeaVersionType } from '@generated/prisma/client'

/**
 * Input contract for creating fixture ideas owned by a specific user.
 */
export type CreateIdeaForUserInput = {
  userId: string
  title: string
  description?: string | null
}

export type CreateIdeaVersionForUserInput = {
  userId: string
  title: string
  description?: string | null
  versionNumber?: number
  versionType?: IdeaVersionType
  canvasElements?: Array<{
    type: CanvasElementType
    content: string
  }>
}

type CreatedIdeaVersionFixture = {
  ideaId: string
  ideaVersionId: string
  userId: string
}

/**
 * Shared fixture builder for creating one idea with one version and optional canvas rows.
 */
const createIdeaWithVersion = async (input: CreateIdeaVersionForUserInput): Promise<CreatedIdeaVersionFixture> => {
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

    const ideaVersion = await tx.ideaVersion.create({
      data: {
        ideaId: idea.id,
        versionNumber: input.versionNumber ?? 1,
        type: input.versionType ?? 'INITIAL',
        title: input.title,
        description: input.description ?? null
      },
      select: {
        id: true
      }
    })

    const canvasElements = input.canvasElements ?? []

    if (canvasElements.length > 0) {
      await tx.canvasElement.createMany({
        data: canvasElements.map(element => ({
          ideaVersionId: ideaVersion.id,
          type: element.type,
          content: element.content
        }))
      })
    }

    return {
      ideaId: idea.id,
      ideaVersionId: ideaVersion.id,
      userId: idea.userId
    }
  })
}

/**
 * Creates an idea fixture and returns only identifiers needed by tests.
 */
export const createIdeaForUser = async (input: CreateIdeaForUserInput) => {
  const created = await createIdeaWithVersion(input)

  return {
    id: created.ideaId,
    userId: created.userId
  }
}

/**
 * Creates an idea with one version and optional canvas elements for e2e fixtures.
 */
export const createIdeaVersionForUser = async (input: CreateIdeaVersionForUserInput) => {
  return createIdeaWithVersion(input)
}
