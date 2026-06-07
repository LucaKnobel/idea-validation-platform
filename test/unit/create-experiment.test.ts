import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import { createCreateExperiment } from '@application/services/create-experiment'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeExperiment,
  makeExperimentRepository,
  makeLogger
} from './helpers'

describe('createCreateExperiment', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let createExperiment: ReturnType<typeof createCreateExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    createExperiment = createCreateExperiment(experimentRepository, logger)
    vi.mocked(experimentRepository.createForHypothesis).mockResolvedValue(makeExperiment())
  })

  it('trims text fields and forwards status', async () => {
    await createExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      title: '  Landing Page Test  ',
      description: '  Validate the onboarding headline.  ',
      status: 'PLANNED'
    })

    expect(experimentRepository.createForHypothesis).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      title: 'Landing Page Test',
      description: 'Validate the onboarding headline.',
      status: 'PLANNED'
    })
  })

  it('returns the created experiment unchanged', async () => {
    const experiment = makeExperiment({ id: 'experiment-xyz' })
    vi.mocked(experimentRepository.createForHypothesis).mockResolvedValueOnce(experiment)

    const result = await createExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      title: 'Landing Page Test',
      description: null,
      status: 'PLANNED'
    })

    expect(result).toEqual(experiment)
  })

  it('logs the created experiment id after success', async () => {
    vi.mocked(experimentRepository.createForHypothesis).mockResolvedValueOnce(
      makeExperiment({ id: 'experiment-xyz' })
    )

    await createExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      title: 'Landing Page Test',
      description: null,
      status: 'PLANNED'
    })

    expect(logger.debug).toHaveBeenCalledWith('Experiment created', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz'
    })
  })

  it('throws HypothesisNotFoundError when the target hypothesis is not accessible', async () => {
    vi.mocked(experimentRepository.createForHypothesis).mockResolvedValueOnce(null)

    await expect(
      createExperiment({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        title: 'Landing Page Test',
        description: null,
        status: 'PLANNED'
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
