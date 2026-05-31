import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUpdateHypothesis } from '@application/services/update-hypothesis'
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

describe('createUpdateHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let updateHypothesis: ReturnType<typeof createUpdateHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    updateHypothesis = createUpdateHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.updateByIdForUser).mockResolvedValue(makeHypothesis())
  })

  it('trims the statement and removes duplicate canvas section types before updating', async () => {
    await updateHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      statement: '  Updated statement  ',
      dimension: 'SOLUTION',
      priority: 'MEDIUM',
      canvasSectionTypes: ['CHANNELS', 'CHANNELS', 'KEY_PARTNERS']
    })

    expect(hypothesisRepository.updateByIdForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-001',
      statement: 'Updated statement',
      dimension: 'SOLUTION',
      priority: 'MEDIUM',
      canvasSectionTypes: ['CHANNELS', 'KEY_PARTNERS']
    })
  })

  it('returns the updated hypothesis unchanged', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-xyz', statement: 'Updated statement' })
    vi.mocked(hypothesisRepository.updateByIdForUser).mockResolvedValueOnce(hypothesis)

    const result = await updateHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-xyz',
      statement: 'Updated statement',
      dimension: 'SOLUTION',
      priority: 'MEDIUM',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(result).toEqual(hypothesis)
  })

  it('logs the updated hypothesis id after success', async () => {
    await updateHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-xyz',
      statement: 'Updated statement',
      dimension: 'SOLUTION',
      priority: 'MEDIUM',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis updated', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-xyz'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(hypothesisRepository.updateByIdForUser).mockResolvedValueOnce(null)

    await expect(
      updateHypothesis({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        hypothesisId: 'hypothesis-xyz',
        statement: 'Updated statement',
        dimension: 'SOLUTION',
        priority: 'MEDIUM',
        canvasSectionTypes: ['CHANNELS']
      })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
