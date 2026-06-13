import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteExperiment } from '@application/services/build-delete-experiment'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import { makeExperimentRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteExperiment', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let deleteExperiment: ReturnType<typeof buildDeleteExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    deleteExperiment = buildDeleteExperiment(experimentRepository, logger)
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

  it('throws ExperimentNotFoundError when no experiment was deleted', async () => {
    vi.mocked(experimentRepository.deleteByHypothesis).mockResolvedValue(false)

    await expect(
      deleteExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
