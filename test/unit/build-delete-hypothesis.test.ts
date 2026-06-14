import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteHypothesis } from '@application/services/build-delete-hypothesis'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesisRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let deleteHypothesis: ReturnType<typeof buildDeleteHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    deleteHypothesis = buildDeleteHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.delete).mockResolvedValue(true)
  })

  it('calls delete with the correct input', async () => {
    await deleteHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisRepository.delete).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(result).toBeUndefined()
  })

  it('logs the deleted hypothesis id', async () => {
    await deleteHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis deleted', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when no hypothesis was deleted', async () => {
    vi.mocked(hypothesisRepository.delete).mockResolvedValue(false)

    await expect(
      deleteHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
