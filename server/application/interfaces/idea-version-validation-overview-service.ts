import type { IdeaVersionValidationOverview } from '@application/models/idea-version-validation-overview'

export type GetIdeaVersionValidationOverviewInput = {
  userId: string
  ideaId: string
  ideaVersionId: string
}

export interface IdeaVersionValidationOverviewService {
  getOverview(input: GetIdeaVersionValidationOverviewInput): Promise<IdeaVersionValidationOverview>
}
