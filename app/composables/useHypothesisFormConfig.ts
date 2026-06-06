interface SelectOption<T> {
  label: string
  value: T
}

interface UseHypothesisFormConfigComposable {
  createEmptyFormState: () => CreateHypothesisBodyDto
  dimensionOptions: ComputedRef<Array<SelectOption<HypothesisDimension>>>
  priorityOptions: ComputedRef<Array<SelectOption<HypothesisPriority>>>
  sectionOptions: ComputedRef<Array<SelectOption<HypothesisCanvasSection>>>
}

export const useHypothesisFormConfig = (): UseHypothesisFormConfigComposable => {
  const { t } = useI18n()

  const createEmptyFormState = (): CreateHypothesisBodyDto => {
    return {
      statement: '',
      dimension: 'PROBLEM',
      priority: 'MEDIUM',
      canvasSectionTypes: []
    }
  }

  const dimensionOptions = computed<Array<SelectOption<HypothesisDimension>>>(() => {
    return [
      { label: t('ideaWorkspace.hypotheses.dimensions.PROBLEM'), value: 'PROBLEM' },
      { label: t('ideaWorkspace.hypotheses.dimensions.SOLUTION'), value: 'SOLUTION' },
      { label: t('ideaWorkspace.hypotheses.dimensions.MARKET'), value: 'MARKET' },
      { label: t('ideaWorkspace.hypotheses.dimensions.MONETIZATION'), value: 'MONETIZATION' },
      { label: t('ideaWorkspace.hypotheses.dimensions.EXECUTION'), value: 'EXECUTION' }
    ]
  })

  const priorityOptions = computed<Array<SelectOption<HypothesisPriority>>>(() => {
    return [
      { label: t('ideaWorkspace.hypotheses.priorities.HIGH'), value: 'HIGH' },
      { label: t('ideaWorkspace.hypotheses.priorities.MEDIUM'), value: 'MEDIUM' },
      { label: t('ideaWorkspace.hypotheses.priorities.LOW'), value: 'LOW' }
    ]
  })

  const sectionOptions = computed<Array<SelectOption<HypothesisCanvasSection>>>(() => {
    return [
      { label: t('ideaWorkspace.canvasPage.sections.KEY_PARTNERS'), value: 'KEY_PARTNERS' },
      { label: t('ideaWorkspace.canvasPage.sections.KEY_ACTIVITIES'), value: 'KEY_ACTIVITIES' },
      { label: t('ideaWorkspace.canvasPage.sections.VALUE_PROPOSITIONS'), value: 'VALUE_PROPOSITIONS' },
      { label: t('ideaWorkspace.canvasPage.sections.CUSTOMER_RELATIONSHIPS'), value: 'CUSTOMER_RELATIONSHIPS' },
      { label: t('ideaWorkspace.canvasPage.sections.CUSTOMER_SEGMENTS'), value: 'CUSTOMER_SEGMENTS' },
      { label: t('ideaWorkspace.canvasPage.sections.KEY_RESOURCES'), value: 'KEY_RESOURCES' },
      { label: t('ideaWorkspace.canvasPage.sections.CHANNELS'), value: 'CHANNELS' },
      { label: t('ideaWorkspace.canvasPage.sections.COST_STRUCTURE'), value: 'COST_STRUCTURE' },
      { label: t('ideaWorkspace.canvasPage.sections.REVENUE_STREAMS'), value: 'REVENUE_STREAMS' }
    ]
  })

  return {
    createEmptyFormState,
    dimensionOptions,
    priorityOptions,
    sectionOptions
  }
}
