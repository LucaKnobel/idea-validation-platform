import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildCreateIdeaVersion } from '@application/services/build-create-idea-version'
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

describe('buildCreateIdeaVersion', () => {
  let repository: IdeaVersionRepository
  let logger: Logger
  let createIdeaVersion: ReturnType<typeof buildCreateIdeaVersion>

  beforeEach(() => {
    repository = makeIdeaVersionRepository()
    logger = makeLogger()
    createIdeaVersion = buildCreateIdeaVersion(repository, logger)

    vi.mocked(repository.getVersionSource).mockResolvedValue({
      baseVersion: makeIdeaVersion({ id: VALID_IDEA_VERSION_ID, versionNumber: 2 }),
      hypotheses: [
        { id: 'hyp-001', status: 'NOT_TESTED' },
        { id: 'hyp-002', status: 'VALIDATED' },
        { id: 'hyp-003', status: 'INVALIDATED' }
      ]
    })

    vi.mocked(repository.createFromSource).mockResolvedValue(
      makeIdeaVersion({
        id: 'idea-version-003',
        parentVersionId: VALID_IDEA_VERSION_ID,
        versionNumber: 3,
        type: 'ITERATION'
      })
    )
  })

  it('throws when the base version is not accessible', async () => {
    vi.mocked(repository.getVersionSource).mockResolvedValue(null)

    await expect(createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'ITERATION'
    })).rejects.toThrow(IdeaVersionNotFoundError)

    expect(repository.createFromSource).not.toHaveBeenCalled()
  })

  it('copies all hypotheses for iteration', async () => {
    await createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'ITERATION'
    })

    expect(repository.createFromSource).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'ITERATION',
      hypothesisIdsToCopy: ['hyp-001', 'hyp-002', 'hyp-003']
    })
  })

  it('filters invalidated hypotheses for pivot', async () => {
    await createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'PIVOT'
    })

    expect(repository.createFromSource).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'PIVOT',
      hypothesisIdsToCopy: ['hyp-001', 'hyp-002']
    })
  })

  it('returns the created version', async () => {
    const result = await createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'ITERATION'
    })

    expect(result.id).toBe('idea-version-003')
  })

  it('logs derivation details', async () => {
    await createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'PIVOT'
    })

    expect(logger.debug).toHaveBeenCalledWith('Idea version derived', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      createdVersionId: 'idea-version-003',
      type: 'PIVOT',
      copiedHypotheses: 2
    })
  })

  it('throws when repository fails to create the new version', async () => {
    vi.mocked(repository.createFromSource).mockResolvedValue(null)

    await expect(createIdeaVersion({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      baseVersionId: VALID_IDEA_VERSION_ID,
      type: 'ITERATION'
    })).rejects.toThrow(IdeaVersionNotFoundError)
  })
})
