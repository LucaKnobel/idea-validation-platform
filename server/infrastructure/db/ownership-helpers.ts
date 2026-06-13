import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type {
  ExperimentIdOwnerInput,
  ExperimentOwnerInput,
  HypothesisIdOwnerInput,
  IdeaVersionOwnerInput,
  HypothesisOwnerInput,
  MeasurementIdOwnerInput,
  MeasurementOwnerInput,
  MetricOwnerInput
} from '@application/interfaces/ownership-inputs'

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
 * Builds a Prisma where filter that constrains one hypothesis id to its owning user.
 */
export const buildOwnedHypothesisByIdWhere = (input: HypothesisIdOwnerInput): Prisma.HypothesisWhereInput => {
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
 * Builds a Prisma where filter that constrains experiments to one owned hypothesis.
 */
export const buildOwnedExperimentsByHypothesisWhere = (input: HypothesisOwnerInput): Prisma.ExperimentWhereInput => {
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
 * Builds a Prisma where filter that constrains one experiment to its owning user.
 */
export const buildOwnedExperimentWhere = (input: ExperimentOwnerInput): Prisma.ExperimentWhereInput => {
  return {
    id: input.experimentId,
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
 * Builds a Prisma where filter that constrains one experiment id to its owning user.
 */
export const buildOwnedExperimentByIdWhere = (input: ExperimentIdOwnerInput): Prisma.ExperimentWhereInput => {
  return {
    id: input.experimentId,
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
 * Builds a Prisma where filter that constrains measurements to one owned experiment.
 */
export const buildOwnedMeasurementsByExperimentWhere = (input: ExperimentOwnerInput): Prisma.MeasurementWhereInput => {
  return {
    experimentId: input.experimentId,
    experiment: {
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
}

/**
 * Builds a Prisma where filter that constrains one measurement to its owning user.
 */
export const buildOwnedMeasurementWhere = (input: MeasurementOwnerInput): Prisma.MeasurementWhereInput => {
  return {
    id: input.measurementId,
    experimentId: input.experimentId,
    experiment: {
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
}

/**
 * Builds a Prisma where filter that constrains one measurement id to its owning user.
 */
export const buildOwnedMeasurementByIdWhere = (input: MeasurementIdOwnerInput): Prisma.MeasurementWhereInput => {
  return {
    id: input.measurementId,
    experiment: {
      hypothesis: {
        ideaVersion: {
          idea: {
            userId: input.userId
          }
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
