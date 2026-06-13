import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildReplaceIdeaVersionCanvas } from '@application/services/build-replace-idea-version-canvas'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import type { CanvasRepository } from '@application/interfaces/canvas-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeCanvasElement,
  makeCanvasRepository,
  makeLogger,
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID
} from './helpers'

describe('buildReplaceIdeaVersionCanvas', () => {
  let canvasRepository: CanvasRepository
  let logger: Logger
  let replaceIdeaVersionCanvas: ReturnType<typeof buildReplaceIdeaVersionCanvas>

  const validElements = [
    { type: 'KEY_PARTNERS' as const, content: 'Supplier A' },
    { type: 'VALUE_PROPOSITIONS' as const, content: 'Core value' }
  ]

  beforeEach(() => {
    canvasRepository = makeCanvasRepository()
    logger = makeLogger()
    replaceIdeaVersionCanvas = buildReplaceIdeaVersionCanvas(canvasRepository, logger)
    vi.mocked(canvasRepository.replaceByIdeaVersion).mockResolvedValue([makeCanvasElement()])
  })

  it('calls replaceByIdeaVersion with the correct input', async () => {
    await replaceIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: validElements
    })

    expect(canvasRepository.replaceByIdeaVersion).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: validElements
    })
  })

  it('returns the saved elements unchanged', async () => {
    const saved = [makeCanvasElement(), makeCanvasElement({ id: 'canvas-002' })]
    vi.mocked(canvasRepository.replaceByIdeaVersion).mockResolvedValue(saved)

    const result = await replaceIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: validElements
    })

    expect(result).toEqual(saved)
  })

  it('logs the replaced element count', async () => {
    vi.mocked(canvasRepository.replaceByIdeaVersion).mockResolvedValue([makeCanvasElement(), makeCanvasElement({ id: 'canvas-002' })])

    await replaceIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      elements: validElements
    })

    expect(logger.debug).toHaveBeenCalledWith('Idea version canvas replaced', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      items: 2
    })
  })

  it('throws IdeaVersionNotFoundError when the version is not accessible', async () => {
    vi.mocked(canvasRepository.replaceByIdeaVersion).mockResolvedValue(null)

    await expect(
      replaceIdeaVersionCanvas({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID,
        elements: validElements
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
