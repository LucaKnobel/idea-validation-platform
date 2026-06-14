import { beforeEach, describe, expect, it, vi } from 'vitest'
import { buildGetIdeaVersionCanvas } from '@application/services/build-get-idea-version-canvas'
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

describe('buildGetIdeaVersionCanvas', () => {
  let canvasRepository: CanvasRepository
  let logger: Logger
  let getIdeaVersionCanvas: ReturnType<typeof buildGetIdeaVersionCanvas>

  beforeEach(() => {
    canvasRepository = makeCanvasRepository()
    logger = makeLogger()
    getIdeaVersionCanvas = buildGetIdeaVersionCanvas(canvasRepository, logger)
    vi.mocked(canvasRepository.listByIdeaVersion).mockResolvedValue([makeCanvasElement()])
  })

  it('loads canvas elements for the requested idea version', async () => {
    await getIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(canvasRepository.listByIdeaVersion).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('returns the repository result unchanged', async () => {
    const elements = [makeCanvasElement(), makeCanvasElement({ id: 'canvas-002', type: 'VALUE_PROPOSITIONS' })]
    vi.mocked(canvasRepository.listByIdeaVersion).mockResolvedValue(elements)

    const result = await getIdeaVersionCanvas({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(result).toEqual(elements)
  })

  it('logs the loaded element count', async () => {
    vi.mocked(canvasRepository.listByIdeaVersion).mockResolvedValue([makeCanvasElement(), makeCanvasElement({ id: 'canvas-002' })])

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

  it('throws IdeaVersionNotFoundError when the version is not accessible', async () => {
    vi.mocked(canvasRepository.listByIdeaVersion).mockResolvedValue(null)

    await expect(
      getIdeaVersionCanvas({ userId: VALID_USER_ID, ideaId: VALID_IDEA_ID, ideaVersionId: VALID_IDEA_VERSION_ID })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
