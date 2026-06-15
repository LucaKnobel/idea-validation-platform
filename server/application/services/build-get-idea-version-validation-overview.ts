import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type {
  IdeaVersionValidationOverviewService,
  GetIdeaVersionValidationOverviewInput
} from '@application/interfaces/idea-version-validation-overview-service'
import type {
  IdeaVersionValidationOverview,
  IdeaVersionValidationOverviewDimensionCard,
  ValidationEvidenceCounts,
  ValidationPriorityCounts,
  ValidationStatusCounts
} from '@application/models/idea-version-validation-overview'
import {
  hypothesisDimensions,
  type Hypothesis,
  type HypothesisDimension
} from '@application/models/hypothesis'
import type { Logger } from '@interfaces/logger'

const createEmptyStatusCounts = (): ValidationStatusCounts => {
  return {
    validated: 0,
    invalidated: 0,
    notTested: 0
  }
}

const createEmptyPriorityCounts = (): ValidationPriorityCounts => {
  return {
    high: 0,
    medium: 0,
    low: 0
  }
}

const createEmptyEvidenceCounts = (): ValidationEvidenceCounts => {
  return {
    qualitative: 0,
    quantitative: 0,
    behavioral: 0,
    monetary: 0
  }
}

const createEmptyDimensionCard = (dimension: HypothesisDimension): IdeaVersionValidationOverviewDimensionCard => {
  return {
    dimension,
    statusCounts: createEmptyStatusCounts(),
    priorityCounts: createEmptyPriorityCounts(),
    evidenceCounts: createEmptyEvidenceCounts()
  }
}

const createEmptyOverview = (input: GetIdeaVersionValidationOverviewInput): IdeaVersionValidationOverview => {
  return {
    ideaId: input.ideaId,
    ideaVersionId: input.ideaVersionId,
    totalHypotheses: 0,
    statusCounts: createEmptyStatusCounts(),
    priorityCounts: createEmptyPriorityCounts(),
    evidenceCounts: createEmptyEvidenceCounts(),
    dimensionCards: hypothesisDimensions.map(dimension => createEmptyDimensionCard(dimension))
  }
}

const incrementStatusCounts = (counts: ValidationStatusCounts, hypothesis: Hypothesis): void => {
  if (hypothesis.status === 'VALIDATED') {
    counts.validated += 1
    return
  }

  if (hypothesis.status === 'INVALIDATED') {
    counts.invalidated += 1
    return
  }

  counts.notTested += 1
}

const incrementPriorityCounts = (counts: ValidationPriorityCounts, hypothesis: Hypothesis): void => {
  counts[hypothesis.priority.toLowerCase() as keyof ValidationPriorityCounts] += 1
}

const incrementEvidenceCounts = (counts: ValidationEvidenceCounts, hypothesis: Hypothesis): void => {
  counts[hypothesis.evidenceType.toLowerCase() as keyof ValidationEvidenceCounts] += 1
}

const aggregateHypotheses = (
  input: GetIdeaVersionValidationOverviewInput,
  hypotheses: Hypothesis[]
): IdeaVersionValidationOverview => {
  const overview = createEmptyOverview(input)
  const dimensionCardMap = new Map<HypothesisDimension, IdeaVersionValidationOverviewDimensionCard>(
    overview.dimensionCards.map(card => [card.dimension, card])
  )

  for (const hypothesis of hypotheses) {
    overview.totalHypotheses += 1
    incrementStatusCounts(overview.statusCounts, hypothesis)
    incrementPriorityCounts(overview.priorityCounts, hypothesis)
    incrementEvidenceCounts(overview.evidenceCounts, hypothesis)

    const dimensionCard = dimensionCardMap.get(hypothesis.dimension)

    if (!dimensionCard) {
      continue
    }

    incrementStatusCounts(dimensionCard.statusCounts, hypothesis)
    incrementPriorityCounts(dimensionCard.priorityCounts, hypothesis)
    incrementEvidenceCounts(dimensionCard.evidenceCounts, hypothesis)
  }

  return overview
}

/**
 * Builds the use case that aggregates validation data for one owned idea version.
 */
export const buildGetIdeaVersionValidationOverview = (
  hypothesisRepository: HypothesisRepository,
  logger: Logger
): IdeaVersionValidationOverviewService => {
  const getOverview = async (
    input: GetIdeaVersionValidationOverviewInput
  ): Promise<IdeaVersionValidationOverview> => {
    const hypotheses = await hypothesisRepository.listByIdeaVersion({
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId
    })

    if (hypotheses === null) {
      throw new IdeaVersionNotFoundError()
    }

    const overview = aggregateHypotheses(input, hypotheses)

    logger.debug('Validation overview loaded', {
      userId: input.userId,
      ideaId: input.ideaId,
      ideaVersionId: input.ideaVersionId,
      totalHypotheses: overview.totalHypotheses
    })

    return overview
  }

  return {
    getOverview
  }
}
