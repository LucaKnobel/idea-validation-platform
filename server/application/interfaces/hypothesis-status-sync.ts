import type { Hypothesis } from '@application/models/hypothesis'

export type SyncHypothesisStatusInput = {
  userId: string
  hypothesisId: string
}

/**
 * Contract for synchronizing one hypothesis status based on related validation artifacts.
 */
export interface HypothesisStatusSyncService {
  sync(input: SyncHypothesisStatusInput): Promise<Hypothesis>
}
