import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type { IdeaVersionOwnerInput, HypothesisOwnerInput, MetricOwnerInput } from '@application/interfaces/ownership-inputs'

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
export const buildOwnedHypothesisWhere = (input: HypothesisOwnerInput): Prisma.HypothesisWhereInput => {
  return {
    id: input.hypothesisId,
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
 * Builds a Prisma where filter that constrains metrics to one owned hypothesis.
 */
export const buildOwnedMetricsByHypothesisWhere = (input: HypothesisOwnerInput): Prisma.MetricWhereInput => {
  return {
    hypothesisId: input.hypothesisId,
    hypothesis: {
      ideaVersionId: input.ideaVersionId,
      ideaVersion: {
        ideaId: input.ideaId,
        idea: {
          userId: input.userId
        }
      }
    }
  }
}

/**
 * Builds a Prisma where filter that constrains one metric to its owning user.
 */
export const buildOwnedMetricWhere = (input: MetricOwnerInput): Prisma.MetricWhereInput => {
  return {
    id: input.metricId,
    hypothesisId: input.hypothesisId,
    hypothesis: {
      ideaVersionId: input.ideaVersionId,
      ideaVersion: {
        ideaId: input.ideaId,
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
