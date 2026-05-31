import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCreateHypothesis } from '@application/services/create-hypothesis'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
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

describe('createCreateHypothesis', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let createHypothesis: ReturnType<typeof createCreateHypothesis>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    createHypothesis = createCreateHypothesis(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.createForIdeaVersion).mockResolvedValue(makeHypothesis())
  })

  it('trims the statement and removes duplicate canvas section types before persisting', async () => {
    await createHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      statement: '  Validate direct sales  ',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      canvasSectionTypes: ['CHANNELS', 'CHANNELS', 'VALUE_PROPOSITIONS']
    })

    expect(hypothesisRepository.createForIdeaVersion).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      statement: 'Validate direct sales',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      canvasSectionTypes: ['CHANNELS', 'VALUE_PROPOSITIONS']
    })
  })

  it('returns the created hypothesis unchanged', async () => {
    const hypothesis = makeHypothesis({ id: 'hypothesis-xyz' })
    vi.mocked(hypothesisRepository.createForIdeaVersion).mockResolvedValueOnce(hypothesis)

    const result = await createHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      statement: 'Validate direct sales',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(result).toEqual(hypothesis)
  })

  it('logs the created hypothesis id after success', async () => {
    vi.mocked(hypothesisRepository.createForIdeaVersion).mockResolvedValueOnce(
      makeHypothesis({ id: 'hypothesis-xyz' })
    )

    await createHypothesis({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      statement: 'Validate direct sales',
      dimension: 'PROBLEM',
      priority: 'HIGH',
      canvasSectionTypes: ['CHANNELS']
    })

    expect(logger.debug).toHaveBeenCalledWith('Hypothesis created', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      hypothesisId: 'hypothesis-xyz'
    })
  })

  it('throws IdeaVersionNotFoundError when the target version is not accessible', async () => {
    vi.mocked(hypothesisRepository.createForIdeaVersion).mockResolvedValueOnce(null)

    await expect(
      createHypothesis({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        statement: 'Validate direct sales',
        dimension: 'PROBLEM',
        priority: 'HIGH',
        canvasSectionTypes: ['CHANNELS']
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
