import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeleteExperiment } from '@application/services/delete-experiment'
import { ExperimentNotFoundError } from '@application/errors/experiment-errors'
import type { ExperimentRepository } from '@application/interfaces/experiment-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeExperimentRepository,
  makeLogger
} from './helpers'

describe('createDeleteExperiment', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let deleteExperiment: ReturnType<typeof createDeleteExperiment>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    deleteExperiment = createDeleteExperiment(experimentRepository, logger)
    vi.mocked(experimentRepository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('deletes the requested experiment for the current user', async () => {
    await deleteExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(experimentRepository.deleteByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(result).toBeUndefined()
  })

  it('logs the deleted experiment id after success', async () => {
    await deleteExperiment({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Experiment deleted', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      experimentId: 'experiment-001'
    })
  })

  it('throws ExperimentNotFoundError when no experiment was deleted', async () => {
    vi.mocked(experimentRepository.deleteByIdForUser).mockResolvedValueOnce(false)

    await expect(
      deleteExperiment({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001',
        experimentId: 'experiment-001'
      })
    ).rejects.toThrow(ExperimentNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
