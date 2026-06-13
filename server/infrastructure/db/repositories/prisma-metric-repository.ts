import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type {
  MetricUpsertInput,
  MetricRepository
} from '@application/interfaces/metric-repository'
import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Metric } from '@application/models/metric'
import {
  buildOwnedHypothesisWhere,
  buildOwnedMetricWhere
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
   * Returns the metric singleton of one owned hypothesis.
   */
  async getByHypothesis(input: HypothesisIdOwnerInput): Promise<Metric | null> {
    const row = await prisma.metric.findFirst({
      where: buildOwnedMetricWhere(input),
      include: {
        threshold: true
      }
    })

    if (row === null) {
      return null
    }

    return toDomainMetric(row)
  },

  /**
   * Creates or updates the metric singleton for one owned hypothesis.
   */
  async upsertByHypothesis(input: MetricUpsertInput): Promise<Metric | null> {
    return prisma.$transaction(async (tx) => {
      const ownedHypothesis = await tx.hypothesis.findFirst({
        where: buildOwnedHypothesisWhere(input),
        select: { id: true }
      })

      if (ownedHypothesis === null) {
        return null
      }

      const row = await tx.metric.upsert({
        where: {
          hypothesisId: input.hypothesisId
        },
        update: {
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
        create: {
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
    })
  },

  /**
   * Deletes the metric singleton of one owned hypothesis.
   */
  async deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean> {
    const result = await prisma.metric.deleteMany({
      where: buildOwnedMetricWhere(input)
    })

    return result.count > 0
  }
}
