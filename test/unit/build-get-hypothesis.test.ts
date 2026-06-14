import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetHypothesis } from '@application/services/build-get-hypothesis'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesis, makeHypothesisRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildGetHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let getHypothesis: ReturnType<typeof buildGetHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    getHypothesis = buildGetHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(makeHypothesis())
  })

  it('calls getById with the correct input', async () => {
    await getHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(hypothesisRepository.getById).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('returns the repository result unchanged', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-002', statement: 'Single hypothesis' })
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(hypothesis)

    const result = await getHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-002' })

    expect(result).toEqual(hypothesis)
  })

  it('logs the loaded hypothesis id', async () => {
    await getHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis loaded', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(hypothesisRepository.getById).mockResolvedValue(null)

    await expect(
      getHypothesis({ userId: VALID_USER_ID, hypothesisId: 'hypothesis-001' })
    ).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
