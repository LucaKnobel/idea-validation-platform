import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import { createUpdateExperiment } from '@application/services/update-experiment'
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

describe('createUpdateExperiment', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let updateExperiment: ReturnType<typeof createUpdateExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    updateExperiment = createUpdateExperiment(experimentRepository, logger)
    vi.mocked(experimentRepository.updateByIdForUser).mockResolvedValue(makeExperiment())
  })

  it('trims text fields and forwards status', async () => {
    await updateExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      title: '  Landing Page Test  ',
      description: '  Validate the onboarding headline.  ',
      status: 'RUNNING'
    })

    expect(experimentRepository.updateByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001',
      title: 'Landing Page Test',
      description: 'Validate the onboarding headline.',
      status: 'RUNNING'
    })
  })

  it('returns the updated experiment unchanged', async () => {
    const experiment = makeExperiment({ id: 'experiment-xyz', title: 'Updated experiment' })
    vi.mocked(experimentRepository.updateByIdForUser).mockResolvedValueOnce(experiment)

    const result = await updateExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz',
      title: 'Updated experiment',
      description: null,
      status: 'COMPLETED'
    })

    expect(result).toEqual(experiment)
  })

  it('logs the updated experiment id after success', async () => {
    vi.mocked(experimentRepository.updateByIdForUser).mockResolvedValueOnce(
      makeExperiment({ id: 'experiment-xyz' })
    )

    await updateExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz',
      title: 'Updated experiment',
      description: null,
      status: 'COMPLETED'
    })

    expect(logger.debug).toHaveBeenCalledWith('Experiment updated', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-xyz'
    })
  })

  it('throws ExperimentNotFoundError when the experiment is not accessible', async () => {
    vi.mocked(experimentRepository.updateByIdForUser).mockResolvedValueOnce(null)

    await expect(
      updateExperiment({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        experimentId: 'experiment-001',
        title: 'Updated experiment',
        description: null,
        status: 'COMPLETED'
      })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
