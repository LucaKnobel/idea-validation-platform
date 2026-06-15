import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUpsertExperiment } from '@application/services/build-upsert-experiment'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import { makeExperiment, makeExperimentRepository, makeHypothesis, makeLogger, VALID_USER_ID } from './helpers'

describe('buildUpsertExperiment', () => {
  let experimentRepository: ExperimentRepository
  let hypothesisStatusSyncService: HypothesisStatusSyncService
  let logger: Logger
  let upsertExperiment: ReturnType<typeof buildUpsertExperiment>

  const validInput = {
    userId: VALID_USER_ID,
    hypothesisId: 'hypothesis-001',
    title: 'Landing Page Test',
    description: 'Validate the onboarding headline.',
    status: 'PLANNED' as const
  }

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    hypothesisStatusSyncService = {
      sync: vi.fn().mockResolvedValue(makeHypothesis())
    }
    logger = makeLogger()
    upsertExperiment = buildUpsertExperiment(experimentRepository, hypothesisStatusSyncService, logger)
    vi.mocked(experimentRepository.upsertByHypothesis).mockResolvedValue(makeExperiment())
  })

  it('calls upsertByHypothesis with the correct input', async () => {
    await upsertExperiment(validInput)

    expect(experimentRepository.upsertByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      title: 'Landing Page Test',
      description: 'Validate the onboarding headline.',
      status: 'PLANNED'
    })
  })

  it('returns the upserted experiment unchanged', async () => {
    const experiment = makeExperiment({ id: 'experiment-xyz' })
    vi.mocked(experimentRepository.upsertByHypothesis).mockResolvedValue(experiment)

    const result = await upsertExperiment(validInput)

    expect(result).toEqual(experiment)
  })

  it('syncs hypothesis status after upsert', async () => {
    await upsertExperiment(validInput)

    expect(hypothesisStatusSyncService.sync).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('logs the upserted experiment id', async () => {
    vi.mocked(experimentRepository.upsertByHypothesis).mockResolvedValue(makeExperiment({ id: 'experiment-xyz' }))

    await upsertExperiment(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Experiment upserted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(experimentRepository.upsertByHypothesis).mockResolvedValue(null)

    await expect(upsertExperiment(validInput)).rejects.toThrow(HypothesisNotFoundError)

    expect(hypothesisStatusSyncService.sync).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
