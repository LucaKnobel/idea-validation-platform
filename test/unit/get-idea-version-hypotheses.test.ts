import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetIdeaVersionHypotheses } from '@application/services/get-idea-version-hypotheses'
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

describe('createGetIdeaVersionHypotheses', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let getIdeaVersionHypotheses: ReturnType<typeof createGetIdeaVersionHypotheses>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    getIdeaVersionHypotheses = createGetIdeaVersionHypotheses(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.listByIdeaVersionForUser).mockResolvedValue([makeHypothesis()])
  })

  it('loads hypotheses for the requested user and idea version', async () => {
    await getIdeaVersionHypotheses({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(hypothesisRepository.listByIdeaVersionForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('returns the repository result unchanged', async () => {
    const hypotheses = [makeHypothesis(), makeHypothesis({ id: 'hypothesis-002' })]
    vi.mocked(hypothesisRepository.listByIdeaVersionForUser).mockResolvedValueOnce(hypotheses)

    const result = await getIdeaVersionHypotheses({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(result).toEqual(hypotheses)
  })

  it('logs the loaded hypothesis count', async () => {
    const hypotheses = [makeHypothesis(), makeHypothesis({ id: 'hypothesis-002' })]
    vi.mocked(hypothesisRepository.listByIdeaVersionForUser).mockResolvedValueOnce(hypotheses)

    await getIdeaVersionHypotheses({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(logger.debug).toHaveBeenCalledWith('Hypotheses listed', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      items: 2
    })
  })

  it('throws IdeaVersionNotFoundError when the version is not accessible', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersionForUser).mockResolvedValueOnce(null)

    await expect(
      getIdeaVersionHypotheses({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
