import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDeleteIdea } from '@application/services/delete-idea'
import { IdeaNotFoundError } from '@application/errors/idea-errors'
import type { IdeaRepository } from '@application/interfaces/idea-repository'
import type { Logger } from '@interfaces/logger'
import { makeIdeaRepository, makeLogger } from './helpers'

describe('createDeleteIdea', () => {
  let repository: IdeaRepository
  let logger: Logger
  let deleteIdea: ReturnType<typeof createDeleteIdea>

  beforeEach(() => {
    repository = makeIdeaRepository()
    logger = makeLogger()
    deleteIdea = createDeleteIdea(repository, logger)
    vi.mocked(repository.deleteByIdForUser).mockResolvedValue(true)
  })

  it('calls deleteByIdForUser with the correct input', async () => {
    await deleteIdea({ userId: 'user-001', ideaId: 'idea-001' })

    expect(repository.deleteByIdForUser).toHaveBeenCalledWith({
      userId: 'user-001',
      ideaId: 'idea-001'
    })
  })

  it('resolves without a return value on success', async () => {
    const result = await deleteIdea({ userId: 'user-001', ideaId: 'idea-001' })

    expect(result).toBeUndefined()
  })

  it('logs a debug message after successful deletion', async () => {
    await deleteIdea({ userId: 'user-001', ideaId: 'idea-001' })

    expect(logger.debug).toHaveBeenCalledWith('Idea deleted', {
      userId: 'user-001',
      ideaId: 'idea-001'
    })
  })

  it('throws IdeaNotFoundError when the repository returns false', async () => {
    vi.mocked(repository.deleteByIdForUser).mockResolvedValue(false)

    await expect(
      deleteIdea({ userId: 'user-001', ideaId: 'idea-001' })
    ).rejects.toThrow(IdeaNotFoundError)
  })

  it('does not log when deletion fails', async () => {
    vi.mocked(repository.deleteByIdForUser).mockResolvedValue(false)

    await expect(
      deleteIdea({ userId: 'user-001', ideaId: 'idea-001' })
    ).rejects.toThrow()

    expect(logger.debug).not.toHaveBeenCalled()
  })

  it('throws IdeaNotFoundError when idea belongs to a different user', async () => {
    // The repository returns false when the userId does not match (ownership check)
    vi.mocked(repository.deleteByIdForUser).mockResolvedValue(false)

    await expect(
      deleteIdea({ userId: 'other-user', ideaId: 'idea-001' })
    ).rejects.toThrow(IdeaNotFoundError)
  })
})
