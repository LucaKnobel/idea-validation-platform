import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type {
  IdeaOwnerInput,
  HypothesisIdOwnerInput,
  IdeaVersionOwnerInput
} from '@application/interfaces/ownership-inputs'

/**
 * Builds a Prisma where filter that constrains one idea to its owning user.
 */
export const buildOwnedIdeaWhere = (input: IdeaOwnerInput): Prisma.IdeaWhereInput => {
  return {
    id: input.ideaId,
    userId: input.userId
  }
}

/**
 * Builds a Prisma where filter that constrains an idea version to its owning user.
 */
export const buildOwnedIdeaVersionWhere = (input: IdeaVersionOwnerInput): Prisma.IdeaVersionWhereInput => {
  return {
    id: input.ideaVersionId,
    ideaId: input.ideaId,
    idea: {
      userId: input.userId
    }
  }
}

/**
 * Builds a Prisma where filter that constrains one hypothesis to its owning user.
 */
export const buildOwnedHypothesisWhere = (input: HypothesisIdOwnerInput): Prisma.HypothesisWhereInput => {
  return {
    id: input.hypothesisId,
    ideaVersion: {
      idea: {
        userId: input.userId
      }
    }
  }
}

/**
 * Builds a Prisma where filter that constrains hypotheses to one owned idea version.
 */
export const buildOwnedHypothesesByIdeaVersionWhere = (input: IdeaVersionOwnerInput): Prisma.HypothesisWhereInput => {
  return {
    ideaVersionId: input.ideaVersionId,
    ideaVersion: {
      ideaId: input.ideaId,
      idea: {
        userId: input.userId
      }
    }
  }
}

/**
 * Builds a Prisma where filter that constrains the metric singleton of one owned hypothesis.
 */
export const buildOwnedMetricWhere = (input: HypothesisIdOwnerInput): Prisma.MetricWhereInput => {
  return {
    hypothesisId: input.hypothesisId,
    hypothesis: {
      ideaVersion: {
        idea: {
          userId: input.userId
        }
      }
    }
  }
}

/**
 * Builds a Prisma where filter that constrains the experiment singleton of one owned hypothesis.
 */
export const buildOwnedExperimentWhere = (input: HypothesisIdOwnerInput): Prisma.ExperimentWhereInput => {
  return {
    hypothesisId: input.hypothesisId,
    hypothesis: {
      ideaVersion: {
        idea: {
          userId: input.userId
        }
      }
    }
  }
}

/**
 * Builds a Prisma where filter that constrains the measurement singleton of one owned hypothesis.
 */
export const buildOwnedMeasurementWhere = (input: HypothesisIdOwnerInput): Prisma.MeasurementWhereInput => {
  return {
    hypothesisId: input.hypothesisId,
    hypothesis: {
      ideaVersion: {
        idea: {
          userId: input.userId
        }
      }
    }
  }
}

/**
 * Returns true when the given idea version belongs to the given user.
 */
export const isIdeaVersionOwnedByUser = async (input: IdeaVersionOwnerInput): Promise<boolean> => {
  const row = await prisma.ideaVersion.findFirst({
    where: buildOwnedIdeaVersionWhere(input),
    select: { id: true }
  })

  return row !== null
}
