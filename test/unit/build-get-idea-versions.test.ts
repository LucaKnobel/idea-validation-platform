import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetIdeaVersions } from '@application/services/build-get-idea-versions'
import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeIdeaVersion,
  makeIdeaVersionRepository,
  makeLogger,
  VALID_IDEA_ID,
  VALID_USER_ID
} from './helpers'

describe('buildGetIdeaVersions', () => {
  let repository: IdeaVersionRepository
  let logger: Logger
  let getIdeaVersions: ReturnType<typeof buildGetIdeaVersions>

  beforeEach(() => {
    repository = makeIdeaVersionRepository()
    logger = makeLogger()
    getIdeaVersions = buildGetIdeaVersions(repository, logger)
    vi.mocked(repository.listByIdea).mockResolvedValue([makeIdeaVersion()])
  })

  it('calls listByIdea with the correct input', async () => {
    await getIdeaVersions({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(repository.listByIdea).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID
    })
  })

  it('returns versions unchanged', async () => {
    const versions = [
      makeIdeaVersion({ id: 'v3', versionNumber: 3 }),
      makeIdeaVersion({ id: 'v2', versionNumber: 2 })
    ]

    vi.mocked(repository.listByIdea).mockResolvedValue(versions)

    const result = await getIdeaVersions({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(result).toEqual(versions)
  })

  it('logs item count', async () => {
    vi.mocked(repository.listByIdea).mockResolvedValue([
      makeIdeaVersion({ id: 'v3', versionNumber: 3 }),
      makeIdeaVersion({ id: 'v2', versionNumber: 2 })
    ])

    await getIdeaVersions({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })

    expect(logger.debug).toHaveBeenCalledWith('Idea versions listed', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      items: 2
    })
  })

  it('throws IdeaNotFoundError when idea is not accessible', async () => {
    vi.mocked(repository.listByIdea).mockResolvedValue(null)

    await expect(getIdeaVersions({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID })).rejects.toThrow(IdeaNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
