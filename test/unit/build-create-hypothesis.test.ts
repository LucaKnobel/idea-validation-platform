import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCreateHypothesis } from '@application/services/build-create-hypothesis'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeHypothesis,
  makeHypothesisRepository,
  makeLogger,
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID
} from './helpers'

describe('buildCreateHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let createHypothesis: ReturnType<typeof buildCreateHypothesis>

  const validInput = {
    userId: VALID_USER_ID,
    ideaId: VALID_IDEA_ID,
    ideaVersionId: VALID_IDEA_VERSION_ID,
    statement: 'Our target segment needs a faster onboarding',
    dimension: 'PROBLEM' as const,
    priority: 'HIGH' as const,
    evidenceType: 'QUALITATIVE' as const,
    canvasElementTypes: ['CUSTOMER_SEGMENTS' as const]
  }

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    createHypothesis = buildCreateHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.create).mockResolvedValue(makeHypothesis())
  })

  it('calls create with the correct input', async () => {
    await createHypothesis(validInput)

    expect(hypothesisRepository.create).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      statement: 'Our target segment needs a faster onboarding',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      evidenceType: 'QUALITATIVE',
      canvasElementTypes: ['CUSTOMER_SEGMENTS']
    })
  })

  it('returns the created hypothesis', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-xyz' })
    vi.mocked(hypothesisRepository.create).mockResolvedValue(hypothesis)

    const result = await createHypothesis(validInput)

    expect(result).toEqual(hypothesis)
  })

  it('logs the created hypothesis id', async () => {
    vi.mocked(hypothesisRepository.create).mockResolvedValue(makeHypothesis({ id: 'hypothesis-xyz' }))

    await createHypothesis(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis created', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-xyz'
    })
  })

  it('throws IdeaVersionNotFoundError when the idea version is not accessible', async () => {
    vi.mocked(hypothesisRepository.create).mockResolvedValue(null)

    await expect(createHypothesis(validInput)).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
