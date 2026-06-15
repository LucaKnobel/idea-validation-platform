import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteExperiment } from '@application/services/build-delete-experiment'
import type { HypothesisStatusSyncService } from '@application/interfaces/hypothesis-status-sync'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import { makeExperimentRepository, makeHypothesis, makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteExperiment', () => {
  let experimentRepository: ExperimentRepository
  let hypothesisStatusSyncService: HypothesisStatusSyncService
  let logger: Logger
  let deleteExperiment: ReturnType<typeof buildDeleteExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    hypothesisStatusSyncService = {
      sync: vi.fn().mockResolvedValue(makeHypothesis())
    }
    logger = makeLogger()
    deleteExperiment = buildDeleteExperiment(experimentRepository, hypothesisStatusSyncService, logger)
    vi.mocked(experimentRepository.deleteByHypothesis).mockResolvedValue(true)
  })

  it('calls deleteByHypothesis with the correct input', async () => {
    await deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(experimentRepository.deleteByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toBeUndefined()
  })

  it('logs the deletion', async () => {
    await deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Experiment deleted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('syncs hypothesis status after deletion', async () => {
    await deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisStatusSyncService.sync).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws ExperimentNotFoundError when no experiment was deleted', async () => {
    vi.mocked(experimentRepository.deleteByHypothesis).mockResolvedValue(false)

    await expect(
      deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(hypothesisStatusSyncService.sync).not.toHaveBeenCalled()
    expect(logger.debug).not.toHaveBeenCalled()
  })
})
