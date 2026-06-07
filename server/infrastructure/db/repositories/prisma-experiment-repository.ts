import type { ExperimentRepository, ExperimentMutationInput, ExperimentWriteInput } from '@application/interfaces/experiment-repository'
import type { HypothesisOwnerInput, ExperimentOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Experiment } from '@application/models/experiment'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import {
  buildOwnedExperimentWhere,
  buildOwnedExperimentsByHypothesisWhere,
  buildOwnedHypothesisWhere,
  isIdeaVersionOwnedByUser
} from '@infrastructure/db/ownership-helpers'

type PrismaExperiment = Prisma.ExperimentGetPayload<Record<string, never>>

const toDomainExperiment = (row: PrismaExperiment): Experiment => {
  return {
    id: row.id,
    hypothesisId: row.hypothesisId,
    title: row.title,
    description: row.description,
    templateId: row.templateId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Prisma-backed implementation of the experiment repository contract.
 */
export const experimentRepository: ExperimentRepository = {
  /**
   * Lists all experiments for a hypothesis owned by the current user.
   */
  async listByHypothesisForUser(input: HypothesisOwnerInput): Promise<Experiment[] | null> {
    const hasIdeaVersionAccess = await isIdeaVersionOwnedByUser({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId
    })

    if (!hasIdeaVersionAccess) {
      return null
    }

    const hasHypothesisAccess = await prisma.hypothesis.findFirst({
      where: buildOwnedHypothesisWhere(input),
      select: { id: true }
    })

    if (hasHypothesisAccess === null) {
      return null
    }

    const rows = await prisma.experiment.findMany({
      where: buildOwnedExperimentsByHypothesisWhere(input),
      orderBy: [
        { createdAt: 'asc' }
      ]
    })

    return rows.map(toDomainExperiment)
  },

  /**
   * Creates one experiment for a hypothesis owned by the current user.
   */
  async createForHypothesis(input: ExperimentWriteInput): Promise<Experiment | null> {
    const hypothesis = await prisma.hypothesis.findFirst({
      where: buildOwnedHypothesisWhere(input),
      select: { id: true }
    })

    if (hypothesis === null) {
      return null
    }

    const row = await prisma.experiment.create({
      data: {
        hypothesisId: input.hypothesisId,
        title: input.title,
        description: input.description,
        templateId: input.templateId,
        status: input.status
      }
    })

    return toDomainExperiment(row)
  },

  /**
   * Updates one experiment owned by the current user.
   */
  async updateByIdForUser(input: ExperimentMutationInput): Promise<Experiment | null> {
    const where = buildOwnedExperimentWhere(input)

    return prisma.$transaction(async (tx) => {
      const existingExperiment = await tx.experiment.findFirst({
        where,
        select: { id: true }
      })

      if (existingExperiment === null) {
        return null
      }

      const row = await tx.experiment.update({
        where: {
          id: existingExperiment.id
        },
        data: {
          title: input.title,
          description: input.description,
          templateId: input.templateId,
          status: input.status
        }
      })

      return toDomainExperiment(row)
    })
  },

  /**
   * Deletes one experiment owned by the current user.
   */
  async deleteByIdForUser(input: ExperimentOwnerInput): Promise<boolean> {
    const result = await prisma.experiment.deleteMany({
      where: buildOwnedExperimentWhere(input)
    })

    return result.count > 0
  }
}
