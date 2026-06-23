import type { IdeaVersionValidationOverview } from '@application/models/idea-version-validation-overview'
import {
  IdeaVersionValidationOverviewResponseSchema,
  type IdeaVersionValidationOverviewResponseDto
} from '@infrastructure/validation/idea-version-validation-overview-schemas'

/**
 * Maps the workspace validation overview aggregate to a public API DTO.
 */
export const toIdeaVersionValidationOverviewResponseDto = (
  overview: IdeaVersionValidationOverview
): IdeaVersionValidationOverviewResponseDto => {
  return IdeaVersionValidationOverviewResponseSchema.parse({
    ideaId: overview.ideaId,
    ideaVersionId: overview.ideaVersionId,
    totalHypotheses: overview.totalHypotheses,
    statusCounts: overview.statusCounts,
    priorityCounts: overview.priorityCounts,
    evidenceCounts: overview.evidenceCounts,
    dimensionCards: overview.dimensionCards
  })
}
