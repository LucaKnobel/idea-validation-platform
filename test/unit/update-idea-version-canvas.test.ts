import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUpdateIdeaVersionCanvas } from '@application/services/update-idea-version-canvas'
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

describe('createUpdateIdeaVersionCanvas', () => {
  let canvasRepository: CanvasRepository
  let logger: Logger
  let updateIdeaVersionCanvas: ReturnType<typeof createUpdateIdeaVersionCanvas>

  beforeEach(() => {
    canvasRepository = makeCanvasRepository()
    logger = makeLogger()
    updateIdeaVersionCanvas = createUpdateIdeaVersionCanvas(canvasRepository, logger)
    vi.mocked(canvasRepository.replaceByIdeaVersionForUser).mockResolvedValue([makeCanvasElement()])
  })

  it('replaces the canvas snapshot for the requested idea version and user', async () => {
    const elements = [
      { type: 'KEY_PARTNERS' as const, content: 'Strategic partner' },
      { type: 'CHANNELS' as const, content: 'Direct sales' }
    ]

    await updateIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements
    })

    expect(canvasRepository.replaceByIdeaVersionForUser).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements
    })
  })

  it('returns the repository result unchanged', async () => {
    const canvasElements = [makeCanvasElement({ content: 'Persisted item' })]
    vi.mocked(canvasRepository.replaceByIdeaVersionForUser).mockResolvedValueOnce(canvasElements)

    const result = await updateIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: []
    })

    expect(result).toEqual(canvasElements)
  })

  it('logs the updated item count', async () => {
    const canvasElements = [makeCanvasElement(), makeCanvasElement({ id: 'canvas-element-002' })]
    vi.mocked(canvasRepository.replaceByIdeaVersionForUser).mockResolvedValueOnce(canvasElements)

    await updateIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: []
    })

    expect(logger.debug).toHaveBeenCalledWith('Idea version canvas updated', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      items: 2
    })
  })

  it('throws when the idea version is not accessible', async () => {
    vi.mocked(canvasRepository.replaceByIdeaVersionForUser).mockResolvedValueOnce(null)

    await expect(
      updateIdeaVersionCanvas({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        elements: []
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)
  })

  it('does not log when the idea version is missing', async () => {
    vi.mocked(canvasRepository.replaceByIdeaVersionForUser).mockResolvedValueOnce(null)

    await expect(
      updateIdeaVersionCanvas({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        elements: []
      })
    ).rejects.toThrow()

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
