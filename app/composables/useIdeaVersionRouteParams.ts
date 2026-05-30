/**
 * Exposes normalized idea and version route parameters for idea workspace pages.
 */
export interface UseIdeaVersionRouteParamsComposable {
  ideaId: ComputedRef<string>
  versionId: ComputedRef<string>
  hasIdeaId: ComputedRef<boolean>
  hasVersionId: ComputedRef<boolean>
  hasIdeaVersionRouteParams: ComputedRef<boolean>
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

  const hasIdeaId = computed(() => ideaId.value.length > 0)
  const hasVersionId = computed(() => versionId.value.length > 0)
  const hasIdeaVersionRouteParams = computed(() => hasIdeaId.value && hasVersionId.value)

  return {
    ideaId,
    versionId,
    hasIdeaId,
    hasVersionId,
    hasIdeaVersionRouteParams
  }
}
