import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetIdea } from '@application/services/build-get-idea'
import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdea, makeIdeaVersionRepository, makeLogger, VALID_IDEA_ID, VALID_USER_ID } from './helpers'

describe('buildGetIdea', () => {
  let repository: IdeaVersionRepository
  let logger: Logger
  let getIdea: ReturnType<typeof buildGetIdea>

  beforeEach(() => {
    repository = makeIdeaVersionRepository()
    logger = makeLogger()
    getIdea = buildGetIdea(repository, logger)
    vi.mocked(repository.getByIdea).mockResolvedValue(makeIdea())
  })

  it('calls getByIdea with the correct input', async () => {
    await getIdea({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(repository.getByIdea).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID
    })
  })

  it('returns the loaded idea', async () => {
    const idea = makeIdea({ id: 'idea-xyz' })
    vi.mocked(repository.getByIdea).mockResolvedValue(idea)

    const result = await getIdea({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(result).toEqual(idea)
  })

  it('logs loaded version count', async () => {
    vi.mocked(repository.getByIdea).mockResolvedValue(makeIdea({ versions: [] }))

    await getIdea({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(logger.debug).toHaveBeenCalledWith('Idea loaded', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      versions: 0
    })
  })

  it('throws IdeaNotFoundError when idea is not accessible', async () => {
    vi.mocked(repository.getByIdea).mockResolvedValue(null)

    await expect(getIdea({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })).rejects.toThrow(IdeaNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
