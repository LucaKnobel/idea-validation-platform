import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type {
  MetricMutationInput,
  MetricRepository,
  MetricWriteInput
} from '@application/interfaces/metric-repository'
import type { HypothesisOwnerInput, MetricOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Metric } from '@application/models/metric'
import {
  buildOwnedHypothesisWhere,
  buildOwnedMetricWhere,
  buildOwnedMetricsByHypothesisWhere,
  isIdeaVersionOwnedByUser
} from '@infrastructure/db/ownership-helpers'

type PrismaMetricWithThreshold = Prisma.MetricGetPayload<{
  include: {
    threshold: true
  }
}>

const toDomainMetric = (row: PrismaMetricWithThreshold): Metric => {
  return {
    id: row.id,
    hypothesisId: row.hypothesisId,
    name: row.name,
    description: row.description,
    unit: row.unit,
    threshold: row.threshold
      ? {
          id: row.threshold.id,
          metricId: row.threshold.metricId,
          operator: row.threshold.operator,
          referenceValue: Number(row.threshold.referenceValue),
          createdAt: row.threshold.createdAt,
          updatedAt: row.threshold.updatedAt
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Prisma-backed implementation of the metric repository contract.
 */
export const metricRepository: MetricRepository = {
  /**
   * Lists all metrics for a hypothesis owned by the current user.
   */
  async listByHypothesisForUser(input: HypothesisOwnerInput): Promise<Metric[] | null> {
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

    const rows = await prisma.metric.findMany({
      where: buildOwnedMetricsByHypothesisWhere(input),
      orderBy: [
        { createdAt: 'asc' }
      ],
      include: {
        threshold: true
      }
    })

    return rows.map(toDomainMetric)
  },

  /**
   * Creates one metric for a hypothesis owned by the current user.
   */
  async createForHypothesis(input: MetricWriteInput): Promise<Metric | null> {
    const hypothesis = await prisma.hypothesis.findFirst({
      where: buildOwnedHypothesisWhere(input),
      select: { id: true }
    })

    if (hypothesis === null) {
      return null
    }

    const row = await prisma.metric.create({
      data: {
        hypothesisId: input.hypothesisId,
        name: input.name,
        description: input.description,
        unit: input.unit,
        threshold: {
          create: {
            operator: input.threshold.operator,
            referenceValue: input.threshold.referenceValue
          }
        }
      },
      include: {
        threshold: true
      }
    })

    return toDomainMetric(row)
  },

  /**
   * Updates one metric owned by the current user.
   */
  async updateByIdForUser(input: MetricMutationInput): Promise<Metric | null> {
    const where = buildOwnedMetricWhere(input)

    return prisma.$transaction(async (tx) => {
      const existingMetric = await tx.metric.findFirst({
        where,
        select: { id: true }
      })

      if (existingMetric === null) {
        return null
      }

      const row = await tx.metric.update({
        where: {
          id: existingMetric.id
        },
        data: {
          name: input.name,
          description: input.description,
          unit: input.unit,
          threshold: {
            upsert: {
              create: {
                operator: input.threshold.operator,
                referenceValue: input.threshold.referenceValue
              },
              update: {
                operator: input.threshold.operator,
                referenceValue: input.threshold.referenceValue
              }
            }
          }
        },
        include: {
          threshold: true
        }
      })

      return toDomainMetric(row)
    })
  },

  /**
   * Deletes one metric owned by the current user.
   */
  async deleteByIdForUser(input: MetricOwnerInput): Promise<boolean> {
    const result = await prisma.metric.deleteMany({
      where: buildOwnedMetricWhere(input)
    })

    return result.count > 0
  }
}
