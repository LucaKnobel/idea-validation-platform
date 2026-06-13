import type { ExperimentRepository, ExperimentUpsertInput } from '@application/interfaces/experiment-repository'
import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Experiment } from '@application/models/experiment'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import {
  buildOwnedExperimentWhere,
  buildOwnedHypothesisWhere
} from '@infrastructure/db/ownership-helpers'

type PrismaExperiment = Prisma.ExperimentGetPayload<Record<string, never>>

const toDomainExperiment = (row: PrismaExperiment): Experiment => {
  return {
    id: row.id,
    hypothesisId: row.hypothesisId,
    title: row.title,
    description: row.description,
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
   * Returns the experiment singleton of one owned hypothesis.
   */
  async getByHypothesis(input: HypothesisIdOwnerInput): Promise<Experiment | null> {
    const row = await prisma.experiment.findFirst({
      where: buildOwnedExperimentWhere(input)
    })

    if (row === null) {
      return null
    }

    return toDomainExperiment(row)
  },

  /**
   * Creates or updates the experiment singleton for one owned hypothesis.
   */
  async upsertByHypothesis(input: ExperimentUpsertInput): Promise<Experiment | null> {
    return prisma.$transaction(async (tx) => {
      const ownedHypothesis = await tx.hypothesis.findFirst({
        where: buildOwnedHypothesisWhere(input),
        select: { id: true }
      })

      if (ownedHypothesis === null) {
        return null
      }

      const row = await tx.experiment.upsert({
        where: {
          hypothesisId: input.hypothesisId
        },
        update: {
          title: input.title,
          description: input.description,
          status: input.status
        },
        create: {
          hypothesisId: input.hypothesisId,
          title: input.title,
          description: input.description,
          status: input.status
        }
      })

      return toDomainExperiment(row)
    })
  },

  /**
   * Deletes the experiment singleton of one owned hypothesis.
   */
  async deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean> {
    const result = await prisma.experiment.deleteMany({
      where: buildOwnedExperimentWhere(input)
    })

    return result.count > 0
  }
}
