import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IdeaVersionNotFoundError } from '@application/errors/idea-errors'
import { buildGetIdeaVersionValidationOverview } from '@application/services/build-get-idea-version-validation-overview'
import type { HypothesisRepository } from '@application/interfaces/hypothesis-repository'
import type { Logger } from '@interfaces/logger'
import {
  makeHypothesis,
  makeHypothesisRepository,
  makeLogger,
  VALID_IDEA_ID,
  VALID_IDEA_VERSION_ID,
  VALID_USER_ID
} from './helpers'

const getCard = (overview: Awaited<ReturnType<ReturnType<typeof buildGetIdeaVersionValidationOverview>['getOverview']>>, dimension: string) => {
  const card = overview.dimensionCards.find(entry => entry.dimension === dimension)

  if (!card) {
    throw new Error(`Missing dimension card: ${dimension}`)
  }

  return card
}

describe('buildGetIdeaVersionValidationOverview', () => {
  let hypothesisRepository: HypothesisRepository
  let logger: Logger
  let getIdeaVersionValidationOverview: ReturnType<typeof buildGetIdeaVersionValidationOverview>

  beforeEach(() => {
    hypothesisRepository = makeHypothesisRepository()
    logger = makeLogger()
    getIdeaVersionValidationOverview = buildGetIdeaVersionValidationOverview(hypothesisRepository, logger)
  })

  it('calls listByIdeaVersion with the correct input', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue([])

    await getIdeaVersionValidationOverview.getOverview({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(hypothesisRepository.listByIdeaVersion).toHaveBeenCalledWith({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })
  })

  it('aggregates validation counts across all hypotheses and dimensions', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue([
      makeHypothesis({
        dimension: 'PROBLEM',
        priority: 'HIGH',
        evidenceType: 'QUALITATIVE',
        status: 'VALIDATED'
      }),
      makeHypothesis({
        id: 'hypothesis-002',
        dimension: 'PROBLEM',
        priority: 'LOW',
        evidenceType: 'MONETARY',
        status: 'VALIDATED'
      }),
      makeHypothesis({
        id: 'hypothesis-003',
        dimension: 'MARKET',
        priority: 'MEDIUM',
        evidenceType: 'QUANTITATIVE',
        status: 'INVALIDATED'
      }),
      makeHypothesis({
        id: 'hypothesis-004',
        dimension: 'MARKET',
        priority: 'LOW',
        evidenceType: 'BEHAVIORAL',
        status: 'NOT_TESTED'
      }),
      makeHypothesis({
        id: 'hypothesis-005',
        dimension: 'EXECUTION',
        priority: 'HIGH',
        evidenceType: 'MONETARY',
        status: 'VALIDATED'
      })
    ])

    const overview = await getIdeaVersionValidationOverview.getOverview({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(overview).toMatchObject({
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      totalHypotheses: 5,
      statusCounts: {
        validated: 3,
        invalidated: 1,
        notTested: 1
      },
      priorityCounts: {
        high: 2,
        medium: 1,
        low: 2
      },
      evidenceCounts: {
        qualitative: 1,
        quantitative: 1,
        behavioral: 1,
        monetary: 2
      }
    })

    expect(getCard(overview, 'PROBLEM')).toMatchObject({
      dimension: 'PROBLEM',
      statusCounts: {
        validated: 2,
        invalidated: 0,
        notTested: 0
      },
      priorityCounts: {
        high: 1,
        medium: 0,
        low: 1
      },
      evidenceCounts: {
        qualitative: 1,
        quantitative: 0,
        behavioral: 0,
        monetary: 1
      }
    })

    expect(getCard(overview, 'MARKET')).toMatchObject({
      dimension: 'MARKET',
      statusCounts: {
        validated: 0,
        invalidated: 1,
        notTested: 1
      },
      priorityCounts: {
        high: 0,
        medium: 1,
        low: 1
      },
      evidenceCounts: {
        qualitative: 0,
        quantitative: 1,
        behavioral: 1,
        monetary: 0
      }
    })

    expect(getCard(overview, 'EXECUTION')).toMatchObject({
      dimension: 'EXECUTION',
      statusCounts: {
        validated: 1,
        invalidated: 0,
        notTested: 0
      },
      priorityCounts: {
        high: 1,
        medium: 0,
        low: 0
      },
      evidenceCounts: {
        qualitative: 0,
        quantitative: 0,
        behavioral: 0,
        monetary: 1
      }
    })
  })

  it('returns zeroed overview when no hypotheses exist', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue([])

    const overview = await getIdeaVersionValidationOverview.getOverview({
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID
    })

    expect(overview.totalHypotheses).toBe(0)
    expect(overview.statusCounts).toEqual({ validated: 0, invalidated: 0, notTested: 0 })
    expect(overview.priorityCounts).toEqual({ high: 0, medium: 0, low: 0 })
    expect(overview.evidenceCounts).toEqual({ qualitative: 0, quantitative: 0, behavioral: 0, monetary: 0 })
    expect(overview.dimensionCards).toHaveLength(5)
    expect(logger.debug).toHaveBeenCalledWith('Validation overview loaded', {
      userId: VALID_USER_ID,
      ideaId: VALID_IDEA_ID,
      ideaVersionId: VALID_IDEA_VERSION_ID,
      totalHypotheses: 0
    })
  })

  it('throws IdeaVersionNotFoundError when the version is not accessible', async () => {
    vi.mocked(hypothesisRepository.listByIdeaVersion).mockResolvedValue(null)

    await expect(
      getIdeaVersionValidationOverview.getOverview({
        userId: VALID_USER_ID,
        ideaId: VALID_IDEA_ID,
        ideaVersionId: VALID_IDEA_VERSION_ID
      })
    ).rejects.toThrow(IdeaVersionNotFoundError)

    expect(logger.debug).not.toHaveBeenCalled()
  })
})
