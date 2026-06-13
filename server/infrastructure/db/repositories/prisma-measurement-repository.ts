import type {
  MeasurementCreateInput,
  MeasurementMutationResult,
  MeasurementRepository,
  MeasurementUpdateInput
} from '@application/interfaces/measurement-repository'
import type { MeasurementIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import {
  buildOwnedHypothesisByIdWhere,
  buildOwnedMeasurementByIdWhere
} from '@infrastructure/db/ownership-helpers'

type PrismaMeasurement = Prisma.MeasurementGetPayload<Record<string, never>>

const isPrismaUniqueConstraintViolation = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  return (error as { code?: string }).code === 'P2002'
}

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
   * Creates one measurement for a hypothesis owned by the current user.
   */
  async createForHypothesis(input: MeasurementCreateInput): Promise<MeasurementMutationResult> {
    const hypothesis = await prisma.hypothesis.findFirst({
      where: buildOwnedHypothesisByIdWhere(input),
      select: {
        id: true,
        experiment: {
          select: { id: true }
        },
        metric: {
          select: { id: true }
        }
      }
    })

    if (hypothesis === null || hypothesis.experiment === null || hypothesis.metric === null) {
      return { kind: 'notFound' }
    }

    if (hypothesis.metric.id !== input.metricId) {
      return { kind: 'notFound' }
    }

    let row: PrismaMeasurement

    try {
      row = await prisma.measurement.create({
        data: {
          experimentId: hypothesis.experiment.id,
          metricId: input.metricId,
          value: input.value,
          note: input.note
        }
      })
    } catch (error) {
      if (isPrismaUniqueConstraintViolation(error)) {
        return { kind: 'conflict' }
      }

      throw error
    }

    return {
      kind: 'success',
      measurement: toDomainMeasurement(row)
    }
  },

  /**
   * Updates one measurement owned by the current user.
   */
  async updateByIdForUser(input: MeasurementUpdateInput): Promise<MeasurementMutationResult> {
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
        return { kind: 'notFound' }
      }

      const metric = await tx.metric.findFirst({
        where: {
          id: input.metricId,
          hypothesisId: existingMeasurement.experiment.hypothesisId
        },
        select: { id: true }
      })

      if (metric === null) {
        return { kind: 'notFound' }
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
          return { kind: 'conflict' }
        }

        throw error
      }

      return {
        kind: 'success',
        measurement: toDomainMeasurement(row)
      }
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
