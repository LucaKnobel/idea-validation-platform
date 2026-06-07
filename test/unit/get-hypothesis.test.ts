import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetHypothesis } from '@application/services/get-hypothesis'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeHypothesis,
  makeHypothesisRepository,
  makeLogger
} from './helpers'

describe('createGetHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let getHypothesis: ReturnType<typeof createGetHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    getHypothesis = createGetHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.getByIdForUser).mockResolvedValue(makeHypothesis())
  })

  it('loads one hypothesis for the requested user and idea version', async () => {
    await getHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(hypothesisRepository.getByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-002', statement: 'Single hypothesis' })
    vi.mocked(hypothesisRepository.getByIdForUser).mockResolvedValueOnce(hypothesis)

    const result = await getHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-002'
    })

    expect(result).toEqual(hypothesis)
  })

  it('logs the loaded hypothesis id after success', async () => {
    await getHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis loaded', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(hypothesisRepository.getByIdForUser).mockResolvedValueOnce(null)

    await expect(
      getHypothesis({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001'
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
