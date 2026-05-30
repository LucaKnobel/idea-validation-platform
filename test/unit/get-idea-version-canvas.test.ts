import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGetIdeaVersionCanvas } from '@application/services/get-idea-version-canvas'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { Logger } from '@interfaces/logger'
import {
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID,
  makeCanvasElement,
  makeCanvasRepository,
  makeLogger
} from './helpers'

describe('createGetIdeaVersionCanvas', () => {
  let canvasRepository: CanvasRepository
  let logger: Logger
  let getIdeaVersionCanvas: ReturnType<typeof createGetIdeaVersionCanvas>

  beforeEach(() => {
    canvasRepository = makeCanvasRepository()
    logger = makeLogger()
    getIdeaVersionCanvas = createGetIdeaVersionCanvas(canvasRepository, logger)
    vi.mocked(canvasRepository.getByIdeaVersionForUser).mockResolvedValue([makeCanvasElement()])
  })

  it('loads canvas entries for the requested idea version and user', async () => {
    await getIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(canvasRepository.getByIdeaVersionForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('returns the repository result unchanged', async () => {
    const canvasElements = [makeCanvasElement({ content: 'First item' })]
    vi.mocked(canvasRepository.getByIdeaVersionForUser).mockResolvedValueOnce(canvasElements)

    const result = await getIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(result).toEqual(canvasElements)
  })

  it('logs the loaded item count', async () => {
    const canvasElements = [makeCanvasElement(), makeCanvasElement({ id: 'canvas-element-002' })]
    vi.mocked(canvasRepository.getByIdeaVersionForUser).mockResolvedValueOnce(canvasElements)

    await getIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(logger.debug).toHaveBeenCalledWith('Idea version canvas loaded', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      items: 2
    })
  })

  it('throws when the idea version is not accessible', async () => {
    vi.mocked(canvasRepository.getByIdeaVersionForUser).mockResolvedValueOnce(null)

    await expect(
      getIdeaVersionCanvas({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)
  })

  it('does not log when the idea version is missing', async () => {
    vi.mocked(canvasRepository.getByIdeaVersionForUser).mockResolvedValueOnce(null)

    await expect(
      getIdeaVersionCanvas({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID
      })
    ).rejects.toThrow()

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
