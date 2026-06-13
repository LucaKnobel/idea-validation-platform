import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetIdeaVersionHypotheses } from '@application/services/build-get-idea-version-hypotheses'
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

describe('buildGetIdeaVersionHypotheses', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let getIdeaVersionHypotheses: ReturnType<typeof buildGetIdeaVersionHypotheses>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    getIdeaVersionHypotheses = buildGetIdeaVersionHypotheses(hypothesisRepository, logger)
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue([makeHypothesis()])
  })

  it('calls listByIdeaVersion with the correct input', async () => {
    await getIdeaVersionHypotheses({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(hypothesisRepository.listByIdeaVersion).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('returns the repository result unchanged', async () => {
    const hypotheses = [makeHypothesis(), makeHypothesis({ id: 'hypothesis-002' })]
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue(hypotheses)

    const result = await getIdeaVersionHypotheses({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(result).toEqual(hypotheses)
  })

  it('logs the loaded hypothesis count', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue([makeHypothesis(), makeHypothesis({ id: 'hypothesis-002' })])

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
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue(null)

    await expect(
      getIdeaVersionHypotheses({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID, ideaVersionId: VALID_IDEA_VERSION_ID })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
