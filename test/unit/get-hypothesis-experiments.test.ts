import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetHypothesisExperiments } from '@application/services/get-hypothesis-experiments'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
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

describe('createGetHypothesisExperiments', () => {
  let experimentRepository: ExperimentRepository
  let logger: Logger
  let getHypothesisExperiments: ReturnType<typeof createGetHypothesisExperiments>

  beforeEach(() => {
    experimentRepository = makeExperimentRepository()
    logger = makeLogger()
    getHypothesisExperiments = createGetHypothesisExperiments(experimentRepository, logger)
    vi.mocked(experimentRepository.listByHypothesisForUser).mockResolvedValue([makeExperiment()])
  })

  it('loads experiments for the requested user and hypothesis', async () => {
    await getHypothesisExperiments({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(experimentRepository.listByHypothesisForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const experiments = [makeExperiment(), makeExperiment({ id: 'experiment-002', title: 'Pricing Test' })]
    vi.mocked(experimentRepository.listByHypothesisForUser).mockResolvedValueOnce(experiments)

    const result = await getHypothesisExperiments({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(result).toEqual(experiments)
  })

  it('logs the loaded experiment count', async () => {
    const experiments = [makeExperiment(), makeExperiment({ id: 'experiment-002' })]
    vi.mocked(experimentRepository.listByHypothesisForUser).mockResolvedValueOnce(experiments)

    await getHypothesisExperiments({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Experiments listed', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      items: 2
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(experimentRepository.listByHypothesisForUser).mockResolvedValueOnce(null)

    await expect(
      getHypothesisExperiments({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001'
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
