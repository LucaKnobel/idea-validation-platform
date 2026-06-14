import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetHypothesisExperiment } from '@application/services/build-get-hypothesis-experiment'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import { makeExperiment, makeExperimentRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildGetHypothesisExperiment', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let getHypothesisExperiment: ReturnType<typeof buildGetHypothesisExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    getHypothesisExperiment = buildGetHypothesisExperiment(experimentRepository, logger)
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(makeExperiment())
  })

  it('calls getByHypothesis with the correct input', async () => {
    await getHypothesisExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(experimentRepository.getByHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const experiment = makeExperiment({ id: 'experiment-xyz' })
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(experiment)

    const result = await getHypothesisExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toEqual(experiment)
  })

  it('logs the loaded experiment id', async () => {
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(makeExperiment({ id: 'experiment-xyz' }))

    await getHypothesisExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Experiment loaded', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz'
    })
  })

  it('throws ExperimentNotFoundError when no experiment exists for the hypothesis', async () => {
    vi.mocked(experimentRepository.getByHypothesis).mockResolvedValue(null)

    await expect(
      getHypothesisExperiment({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
