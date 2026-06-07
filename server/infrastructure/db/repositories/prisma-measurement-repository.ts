import type {
  MeasurementMutationInput,
  MeasurementRepository,
  MeasurementWriteInput
} from '@application/interfaces/measurement-repository'
import type { ExperimentOwnerInput, MeasurementOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import {
  buildOwnedExperimentWhere,
  buildOwnedMeasurementWhere,
  buildOwnedMeasurementsByExperimentWhere
} from '@infrastructure/db/ownership-helpers'

type PrismaMeasurement = Prisma.MeasurementGetPayload<Record<string, never>>

const toDomainMeasurement = (row: PrismaMeasurement): Measurement => {
  return {
    id: row.id,
    experimentId: row.experimentId,
    metricId: row.metricId,
    value: Number(row.value),
    note: row.note,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

/**
 * Prisma-backed implementation of the measurement repository contract.
 */
export const measurementRepository: MeasurementRepository = {
  /**
   * Lists all measurements for an experiment owned by the current user.
   */
  async listByExperimentForUser(input: ExperimentOwnerInput): Promise<Measurement[] | null> {
    const hasExperimentAccess = await prisma.experiment.findFirst({
      where: buildOwnedExperimentWhere(input),
      select: { id: true }
    })

    if (hasExperimentAccess === null) {
      return null
    }

    const rows = await prisma.measurement.findMany({
      where: buildOwnedMeasurementsByExperimentWhere(input),
      orderBy: [
        { createdAt: 'asc' }
      ]
    })

    return rows.map(toDomainMeasurement)
  },

  /**
   * Creates one measurement in an experiment owned by the current user.
   */
  async createForExperiment(input: MeasurementWriteInput): Promise<Measurement | null> {
    const experiment = await prisma.experiment.findFirst({
      where: buildOwnedExperimentWhere(input),
      select: {
        id: true,
        hypothesisId: true
      }
    })

    if (experiment === null) {
      return null
    }

    const metric = await prisma.metric.findFirst({
      where: {
        id: input.metricId,
        hypothesisId: experiment.hypothesisId
      },
      select: { id: true }
    })

    if (metric === null) {
      return null
    }

    const row = await prisma.measurement.create({
      data: {
        experimentId: input.experimentId,
        metricId: input.metricId,
        value: input.value,
        note: input.note
      }
    })

    return toDomainMeasurement(row)
  },

  /**
   * Updates one measurement owned by the current user.
   */
  async updateByIdForUser(input: MeasurementMutationInput): Promise<Measurement | null> {
    const where = buildOwnedMeasurementWhere(input)

    return prisma.$transaction(async (tx) => {
      const existingMeasurement = await tx.measurement.findFirst({
        where,
        select: {
          id: true,
          experiment: {
            select: {
              hypothesisId: true
            }
          }
        }
      })

      if (existingMeasurement === null) {
        return null
      }

      const metric = await tx.metric.findFirst({
        where: {
          id: input.metricId,
          hypothesisId: existingMeasurement.experiment.hypothesisId
        },
        select: { id: true }
      })

      if (metric === null) {
        return null
      }

      const row = await tx.measurement.update({
        where: {
          id: existingMeasurement.id
        },
        data: {
          metricId: input.metricId,
          value: input.value,
          note: input.note
        }
      })

      return toDomainMeasurement(row)
    })
  },

  /**
   * Deletes one measurement owned by the current user.
   */
  async deleteByIdForUser(input: MeasurementOwnerInput): Promise<boolean> {
    const result = await prisma.measurement.deleteMany({
      where: buildOwnedMeasurementWhere(input)
    })

    return result.count > 0
  }
}
