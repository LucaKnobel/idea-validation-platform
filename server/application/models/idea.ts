import type { IdeaVersion } from '@application/models/idea-version'
import { IdeaHasNoVersionsError } from '@application/errors/idea-errors'

export type Idea = {
  id: string
  userId: string
  versions: IdeaVersion[]
  createdAt: Date
  updatedAt: Date
}

export const getLatestIdeaVersion = (idea: Idea): IdeaVersion => {
  if (idea.versions.length === 0) {
    throw new IdeaHasNoVersionsError(idea.id)
  }

  const latest = idea.versions.reduce((currentLatest, version) => {
    return version.versionNumber > currentLatest.versionNumber ? version : currentLatest
  })

  return latest
}
