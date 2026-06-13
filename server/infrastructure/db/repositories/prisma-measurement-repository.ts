import type {
  MeasurementCreateInput,
  MeasurementRepository,
  MeasurementUpdateInput
} from '@application/interfaces/measurement-repository'
import { UniqueConstraintViolationError } from '@application/errors/persistence-errors'
import type { MeasurementIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import { isPrismaUniqueConstraintViolation } from '@infrastructure/db/prisma-error-helpers'
import {
  buildOwnedExperimentByIdWhere,
  buildOwnedMeasurementByIdWhere
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
   * Returns one measurement owned by the current user.
   */
  async getByIdForUser(input: MeasurementIdOwnerInput): Promise<Measurement | null> {
    const row = await prisma.measurement.findFirst({
      where: buildOwnedMeasurementByIdWhere(input)
    })

    if (row === null) {
      return null
    }

    return toDomainMeasurement(row)
  },

  /**
   * Creates one measurement for an experiment owned by the current user.
   */
  async createForExperiment(input: MeasurementCreateInput): Promise<Measurement | null> {
    const experiment = await prisma.experiment.findFirst({
      where: buildOwnedExperimentByIdWhere(input),
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
      select: {
        id: true
      }
    })

    if (metric === null) {
      return null
    }

    let row: PrismaMeasurement

    try {
      row = await prisma.measurement.create({
        data: {
          experimentId: experiment.id,
          metricId: input.metricId,
          value: input.value,
          note: input.note
        }
      })
    } catch (error) {
      if (isPrismaUniqueConstraintViolation(error)) {
        throw new UniqueConstraintViolationError()
      }

      throw error
    }

    return toDomainMeasurement(row)
  },

  /**
   * Updates one measurement owned by the current user.
   */
  async updateByIdForUser(input: MeasurementUpdateInput): Promise<Measurement | null> {
    const where = buildOwnedMeasurementByIdWhere(input)

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

      let row: PrismaMeasurement

      try {
        row = await tx.measurement.update({
          where: {
            id: existingMeasurement.id
          },
          data: {
            metricId: input.metricId,
            value: input.value,
            note: input.note
          }
        })
      } catch (error) {
        if (isPrismaUniqueConstraintViolation(error)) {
          throw new UniqueConstraintViolationError()
        }

        throw error
      }

      return toDomainMeasurement(row)
    })
  },

  /**
   * Deletes one measurement owned by the current user.
   */
  async deleteByIdForUser(input: MeasurementIdOwnerInput): Promise<boolean> {
    const result = await prisma.measurement.deleteMany({
      where: buildOwnedMeasurementByIdWhere(input)
    })

    return result.count > 0
  }
}
