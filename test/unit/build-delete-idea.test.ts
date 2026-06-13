import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildDeleteIdea } from '@application/services/build-delete-idea'
import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdeaRepository, makeLogger, VALID_USER_ID } from './helpers'

describe('buildDeleteIdea', () => {
  let repository: IdeaRepository
  let logger: Logger
  let deleteIdea: ReturnType<typeof buildDeleteIdea>

  beforeEach(() => {
    repository = makeIdeaRepository()
    logger = makeLogger()
    deleteIdea = buildDeleteIdea(repository, logger)
    vi.mocked(repository.delete).mockResolvedValue(true)
  })

  it('calls delete with the correct input', async () => {
    await deleteIdea({ userId: VALID_USER_ID, ideaId: 'idea-001' })

    expect(repository.delete).toHaveBeenCalledWith({ userId: VALID_USER_ID, ideaId: 'idea-001' })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteIdea({ userId: VALID_USER_ID, ideaId: 'idea-001' })

    expect(result).toBeUndefined()
  })

  it('logs a debug message after successful deletion', async () => {
    await deleteIdea({ userId: VALID_USER_ID, ideaId: 'idea-001' })

    expect(logger.debug).toHaveBeenCalledWith('Idea deleted', { userId: VALID_USER_ID, ideaId: 'idea-001' })
  })

  it('throws IdeaNotFoundError when the repository returns false', async () => {
    vi.mocked(repository.delete).mockResolvedValue(false)

    await expect(
      deleteIdea({ userId: VALID_USER_ID, ideaId: 'idea-001' })
    ).rejects.toThrow(IdeaNotFoundError)
  })

  it('does not log when deletion fails', async () => {
    vi.mocked(repository.delete).mockResolvedValue(false)

    await expect(deleteIdea({ userId: VALID_USER_ID, ideaId: 'idea-001' })).rejects.toThrow()

    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('throws IdeaNotFoundError when idea belongs to a different user', async () => {
    vi.mocked(repository.delete).mockResolvedValue(false)

    await expect(
      deleteIdea({ userId: 'other-user', ideaId: 'idea-001' })
    ).rejects.toThrow(IdeaNotFoundError)
  })
})
