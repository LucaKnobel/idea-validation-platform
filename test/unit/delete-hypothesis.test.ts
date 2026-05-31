import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeleteHypothesis } from '@application/services/delete-hypothesis'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeHypothesisRepository,
  makeLogger
} from './helpers'

describe('createDeleteHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let deleteHypothesis: ReturnType<typeof createDeleteHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    deleteHypothesis = createDeleteHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('deletes the requested hypothesis for the current user', async () => {
    await deleteHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(hypothesisRepository.deleteByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(result).toBeUndefined()
  })

  it('logs the deleted hypothesis id after success', async () => {
    await deleteHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis deleted', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when no hypothesis was deleted', async () => {
    vi.mocked(hypothesisRepository.deleteByIdForUser).mockResolvedValueOnce(false)

    await expect(
      deleteHypothesis({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-001'
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
