/**
 * Exposes normalized idea and version route parameters for idea workspace pages.
 */
export interface UseIdeaVersionRouteParamsComposable {
  ideaId: ComputedRef<string>
  versionId: ComputedRef<string>
  hypothesisId: ComputedRef<string>
  hasIdeaVersionRouteParams: ComputedRef<boolean>
  hasIdeaVersionHypothesisRouteParams: ComputedRef<boolean>
}

/**
 * Reads idea/version params from the current route and normalizes non-string values to empty strings.
 */
export const useIdeaVersionRouteParams = (): UseIdeaVersionRouteParamsComposable => {
  const route = useRoute()

  const ideaId = computed(() => {
    const value = route.params.ideaId
    return typeof value === 'string' ? value : ''
  })

  const versionId = computed(() => {
    const value = route.params.versionId
    return typeof value === 'string' ? value : ''
  })

  const hypothesisId = computed(() => {
    const value = route.params.hypothesisId
    return typeof value === 'string' ? value : ''
  })

  const hasIdeaVersionRouteParams = computed(() => ideaId.value.length > 0 && versionId.value.length > 0)
  const hasIdeaVersionHypothesisRouteParams = computed(() => {
    return hasIdeaVersionRouteParams.value && hypothesisId.value.length > 0
  })

  return {
    ideaId,
    versionId,
    hypothesisId,
    hasIdeaVersionRouteParams,
    hasIdeaVersionHypothesisRouteParams
  }
}
