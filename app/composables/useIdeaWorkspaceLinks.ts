/**
 * Public API for locale-aware links inside one idea workspace.
 */
export interface UseIdeaWorkspaceLinksComposable {
  toDashboard: () => string
  toIdeaVersionSection: (section: string) => string
  toHypothesesList: () => string
  toHypothesisDetails: (hypothesisId: string) => string
}

/**
 * Builds locale-aware dashboard and workspace routes from the current idea/version params.
 */
export const useIdeaWorkspaceLinks = (): UseIdeaWorkspaceLinksComposable => {
  const localePath = useLocalePath()
  const {
    ideaId,
    versionId,
    hasIdeaVersionRouteParams
  } = useIdeaVersionRouteParams()

  const toDashboard = (): string => {
    return localePath('/dashboard')
  }

  const toIdeaVersionSection = (section: string): string => {
    if (!hasIdeaVersionRouteParams.value) {
      return toDashboard()
    }

    return localePath(`/ideas/${ideaId.value}/versions/${versionId.value}/${section}`)
  }

  const toHypothesesList = (): string => {
    return toIdeaVersionSection('hypotheses')
  }

  const toHypothesisDetails = (hypothesisId: string): string => {
    if (!hasIdeaVersionRouteParams.value) {
      return toDashboard()
    }

    return localePath(`/ideas/${ideaId.value}/versions/${versionId.value}/hypotheses/${hypothesisId}`)
  }

  return {
    toDashboard,
    toIdeaVersionSection,
    toHypothesesList,
    toHypothesisDetails
  }
}
