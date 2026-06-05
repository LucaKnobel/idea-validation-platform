import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type { MetricThresholdMutationInput, MetricThresholdRepository } from '@application/interfaces/metric-threshold-repository'
import type { MetricThreshold } from '@application/models/metric-threshold'
import type { MetricOwnerInput } from '@application/interfaces/ownership-inputs'
import { buildOwnedMetricWhere } from '@infrastructure/db/ownership-helpers'

type PrismaMetricThreshold = Prisma.MetricThresholdGetPayload<Prisma.MetricThresholdDefaultArgs>

const toDomainMetricThreshold = (row: PrismaMetricThreshold): MetricThreshold => {
  return {
    id: row.id,
    metricId: row.metricId,
    operator: row.operator,
    referenceValue: Number(row.referenceValue),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Prisma-backed implementation of the metric-threshold repository contract.
 */
export const metricThresholdRepository: MetricThresholdRepository = {
  /**
   * Upserts one threshold for a metric owned by the current user.
   */
  async upsertByMetricForUser(input: MetricThresholdMutationInput): Promise<MetricThreshold | null> {
    const metric = await prisma.metric.findFirst({
      where: buildOwnedMetricWhere(input),
      select: { id: true }
    })

    if (metric === null) {
      return null
    }

    const row = await prisma.metricThreshold.upsert({
      where: {
        metricId: input.metricId
      },
      create: {
        metricId: input.metricId,
        operator: input.operator,
        referenceValue: input.referenceValue
      },
      update: {
        operator: input.operator,
        referenceValue: input.referenceValue
      }
    })

    return toDomainMetricThreshold(row)
  },

  /**
   * Deletes one threshold for a metric owned by the current user.
   */
  async deleteByMetricForUser(input: MetricOwnerInput): Promise<boolean> {
    const metric = await prisma.metric.findFirst({
      where: buildOwnedMetricWhere(input),
      select: { id: true }
    })

    if (metric === null) {
      return false
    }

    const result = await prisma.metricThreshold.deleteMany({
      where: {
        metricId: input.metricId
      }
    })

    return result.count > 0
  }
}
