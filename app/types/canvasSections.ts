import type { ReplaceIdeaVersionCanvasBodyDto } from '#shared/types/canvas'

export type CanvasSectionType = ReplaceIdeaVersionCanvasBodyDto['elements'][number]['type']
export type CanvasDraftState = Record<CanvasSectionType, string>

/**
 * Single source of truth for all Business Model Canvas sections.
 *
 * Keep this order stable because it drives:
 * - section rendering order in the UI
 * - deterministic snapshot creation for change detection
 * - section type validation in frontend schemas
 */
export const CANVAS_SECTION_ORDER = [
  'KEY_PARTNERS',
  'KEY_ACTIVITIES',
  'VALUE_PROPOSITIONS',
  'CUSTOMER_RELATIONSHIPS',
  'CUSTOMER_SEGMENTS',
  'KEY_RESOURCES',
  'CHANNELS',
  'COST_STRUCTURE',
  'REVENUE_STREAMS'
] as const satisfies readonly CanvasSectionType[]

/**
 * Creates an empty draft map for every known canvas section.
 */
export const createEmptyCanvasDraft = (): CanvasDraftState => {
  return {
    KEY_PARTNERS: '',
    KEY_ACTIVITIES: '',
    VALUE_PROPOSITIONS: '',
    CUSTOMER_RELATIONSHIPS: '',
    CUSTOMER_SEGMENTS: '',
    KEY_RESOURCES: '',
    CHANNELS: '',
    COST_STRUCTURE: '',
    REVENUE_STREAMS: ''
  }
}
