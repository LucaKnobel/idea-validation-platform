import type { IdeaVersion } from '@application/models/idea-version'

export type Idea = {
  id: string
  userId: string
  versions: IdeaVersion[]
  createdAt: Date
  updatedAt: Date
}

export const getLatestIdeaVersion = (idea: Idea): IdeaVersion => {
  const latest = idea.versions[0]

  if (!latest) {
    throw new Error(`Idea ${idea.id} is missing versions.`)
  }

  return latest
}
