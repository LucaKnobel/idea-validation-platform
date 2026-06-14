import type {
  MeasurementRepository,
  MeasurementUpsertInput
} from '@application/interfaces/measurement-repository'
import type { HypothesisIdOwnerInput } from '@application/interfaces/ownership-inputs'
import type { Measurement } from '@application/models/measurement'
import type { Prisma } from '@generated/prisma/client'
import { prisma } from '@infrastructure/db/prisma'
import {
  buildOwnedHypothesisWhere,
  buildOwnedMeasurementWhere
} from '@infrastructure/db/ownership-helpers'

type PrismaMeasurement = Prisma.MeasurementGetPayload<Record<string, never>>

const toDomainMeasurement = (row: PrismaMeasurement): Measurement => {
  return {
    id: row.id,
    hypothesisId: row.hypothesisId,
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
   * Returns the measurement singleton of one owned hypothesis.
   */
  async getByHypothesis(input: HypothesisIdOwnerInput): Promise<Measurement | null> {
    const row = await prisma.measurement.findFirst({
      where: buildOwnedMeasurementWhere(input)
    })

    if (row === null) {
      return null
    }

    return toDomainMeasurement(row)
  },

  /**
   * Creates or updates the measurement singleton for one owned hypothesis.
   */
  async upsertByHypothesis(input: MeasurementUpsertInput): Promise<Measurement | null> {
    return prisma.$transaction(async (tx) => {
      const ownedHypothesis = await tx.hypothesis.findFirst({
        where: buildOwnedHypothesisWhere(input),
        select: { id: true }
      })

      if (ownedHypothesis === null) {
        return null
      }

      const row = await tx.measurement.upsert({
        where: {
          hypothesisId: input.hypothesisId
        },
        update: {
          value: input.value,
          note: input.note
        },
        create: {
          hypothesisId: input.hypothesisId,
          value: input.value,
          note: input.note
        }
      })

      return toDomainMeasurement(row)
    })
  },

  /**
   * Deletes the measurement singleton of one owned hypothesis.
   */
  async deleteByHypothesis(input: HypothesisIdOwnerInput): Promise<boolean> {
    const result = await prisma.measurement.deleteMany({
      where: buildOwnedMeasurementWhere(input)
    })

    return result.count > 0
  }
}
