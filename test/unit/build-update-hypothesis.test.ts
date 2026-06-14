import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUpdateHypothesis } from '@application/services/build-update-hypothesis'
import { HypothesisNotFoundError } from '@application/errors/hypothesis-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import { makeHypothesis, makeHypothesisRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildUpdateHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let updateHypothesis: ReturnType<typeof buildUpdateHypothesis>

  const validInput = {
    userId: VALID_USER_ID,
    hypothesisId: 'hypothesis-001',
    statement: 'Updated statement',
    dimension: 'SOLUTION' as const,
    priority: 'MEDIUM' as const,
    evidenceType: 'QUANTITATIVE' as const,
    canvasElementTypes: ['CHANNELS' as const]
  }

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    updateHypothesis = buildUpdateHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.update).mockResolvedValue(makeHypothesis())
  })

  it('calls update with the correct input', async () => {
    await updateHypothesis(validInput)

    expect(hypothesisRepository.update).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001',
      statement: 'Updated statement',
      dimension: 'SOLUTION',
      priority: 'MEDIUM',
      evidenceType: 'QUANTITATIVE',
      canvasElementTypes: ['CHANNELS']
    })
  })

  it('returns the updated hypothesis unchanged', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-001', statement: 'Updated statement' })
    vi.mocked(hypothesisRepository.update).mockResolvedValue(hypothesis)

    const result = await updateHypothesis(validInput)

    expect(result).toEqual(hypothesis)
  })

  it('logs the updated hypothesis id', async () => {
    await updateHypothesis(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis updated', {
      userId: VALID_USER_ID,
      hypothesisId: 'hypothesis-001'
    })
  })

  it('throws HypothesisNotFoundError when the hypothesis is not accessible', async () => {
    vi.mocked(hypothesisRepository.update).mockResolvedValue(null)

    await expect(updateHypothesis(validInput)).rejects.toThrow(HypothesisNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
