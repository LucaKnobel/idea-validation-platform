import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildUpdateIdeaVersion } from '@application/services/build-update-idea-version'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { IdeaVersionRepository } from '@application/interfaces/idea-version-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeIdeaVersion,
  makeIdeaVersionRepository,
  makeLogger,
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID
} from './helpers'

describe('buildUpdateIdeaVersion', () => {
  let ideaVersionRepository: IdeaVersionRepository
  let logger: Logger
  let updateIdeaVersion: ReturnType<typeof buildUpdateIdeaVersion>

  const validInput = {
    userId: VALID_USER_ID,
    ideaId: VALID_IDEA_ID,
    ideaVersionId: VALID_IDEA_VERSION_ID,
    title: 'Updated title',
    description: 'Updated description'
  }

  beforeEach(() => {
    ideaVersionRepository = makeIdeaVersionRepository()
    logger = makeLogger()
    updateIdeaVersion = buildUpdateIdeaVersion(ideaVersionRepository, logger)
    vi.mocked(ideaVersionRepository.updateMetadata).mockResolvedValue(makeIdeaVersion())
  })

  it('calls updateMetadata with the correct input', async () => {
    await updateIdeaVersion(validInput)

    expect(ideaVersionRepository.updateMetadata).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      title: 'Updated title',
      description: 'Updated description'
    })
  })

  it('returns the updated version unchanged', async () => {
    const updated = makeIdeaVersion({
      id: VALID_IDEA_VERSION_ID,
      title: 'Updated title',
      description: 'Updated description'
    })
    vi.mocked(ideaVersionRepository.updateMetadata).mockResolvedValue(updated)

    const result = await updateIdeaVersion(validInput)

    expect(result).toEqual(updated)
  })

  it('logs successful metadata updates', async () => {
    await updateIdeaVersion(validInput)

    expect(logger.debug).toHaveBeenCalledWith('Idea version metadata updated', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('throws IdeaVersionNotFoundError when the version is not accessible', async () => {
    vi.mocked(ideaVersionRepository.updateMetadata).mockResolvedValue(null)

    await expect(updateIdeaVersion(validInput)).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
