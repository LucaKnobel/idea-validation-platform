import { prisma } from '@infrastructure/db/prisma'
import type { Prisma } from '@generated/prisma/client'
import type {
  CreateVersionFromSourceInput,
  IdeaVersionListInput,
  IdeaVersionRepository,
  VersionSource
} from '@application/interfaces/idea-version-repository'
import type { Idea } from '@application/models/idea'
import type { IdeaVersion } from '@application/models/idea-version'
import type { IdeaVersionOwnerInput } from '@application/interfaces/ownership-inputs'

// ---------------------------------------------------------------------------
// Prisma payload types
// ---------------------------------------------------------------------------

type PrismaIdeaWithVersions = Prisma.IdeaGetPayload<{
  include: {
    versions: {
      orderBy: { versionNumber: 'desc' }
      take: 1
    }
  }
}>

type PrismaIdeaVersion = Prisma.IdeaVersionGetPayload<Record<string, never>>

type PrismaBaseVersion = Prisma.IdeaVersionGetPayload<{
  include: {
    canvasElements: true
    hypotheses: {
      include: {
        canvasSectionLinks: true
        metric: { include: { threshold: true } }
        experiment: true
        measurement: true
      }
    }
  }
}>

type Tx = Prisma.TransactionClient

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

const toDomainIdeaVersion = (row: PrismaIdeaVersion): IdeaVersion => ({
  id: row.id,
  ideaId: row.ideaId,
  parentVersionId: row.parentVersionId,
  versionNumber: row.versionNumber,
  type: row.type,
  title: row.title,
  description: row.description,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

const toDomainIdea = (row: PrismaIdeaWithVersions): Idea => ({
  id: row.id,
  userId: row.userId,
  versions: row.versions.map(version => ({
    id: version.id,
    ideaId: version.ideaId,
    parentVersionId: version.parentVersionId,
    versionNumber: version.versionNumber,
    type: version.type,
    title: version.title,
    description: version.description,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt
  })),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const buildIdeaWhere = (input: Pick<IdeaVersionListInput, 'userId' | 'search'>): Prisma.IdeaWhereInput => {
  if (!input.search) {
    return { userId: input.userId }
  }

  return {
    userId: input.userId,
    versions: {
      some: {
        OR: [
          { title: { contains: input.search, mode: 'insensitive' } },
          { description: { contains: input.search, mode: 'insensitive' } }
        ]
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Transaction helpers for createFromSource
// ---------------------------------------------------------------------------

const loadOwnedBaseVersion = async (tx: Tx, input: CreateVersionFromSourceInput): Promise<PrismaBaseVersion | null> => {
  return tx.ideaVersion.findFirst({
    where: {
      id: input.baseVersionId,
      ideaId: input.ideaId,
      idea: { userId: input.userId }
    },
    include: {
      canvasElements: true,
      hypotheses: {
        include: {
          canvasSectionLinks: true,
          metric: { include: { threshold: true } },
          experiment: true,
          measurement: true
        }
      }
    }
  })
}

const getNextVersionNumber = async (tx: Tx, ideaId: string): Promise<number> => {
  const result = await tx.ideaVersion.aggregate({
    where: { ideaId },
    _max: { versionNumber: true }
  })
  return (result._max.versionNumber ?? 0) + 1
}

const createDerivedVersion = async (
  tx: Tx,
  input: CreateVersionFromSourceInput,
  baseVersion: PrismaBaseVersion,
  nextVersionNumber: number
): Promise<PrismaIdeaVersion> => {
  return tx.ideaVersion.create({
    data: {
      ideaId: input.ideaId,
      parentVersionId: input.baseVersionId,
      versionNumber: nextVersionNumber,
      type: input.type,
      title: baseVersion.title,
      description: baseVersion.description
    }
  })
}

const copyCanvasElements = async (tx: Tx, baseVersion: PrismaBaseVersion, newVersionId: string): Promise<void> => {
  if (baseVersion.canvasElements.length === 0) return

  await tx.canvasElement.createMany({
    data: baseVersion.canvasElements.map(element => ({
      ideaVersionId: newVersionId,
      type: element.type,
      content: element.content
    }))
  })
}

type PrismaHypothesisWithChildren = PrismaBaseVersion['hypotheses'][number]

const copyHypothesisCanvasLinks = async (
  tx: Tx,
  hypothesis: PrismaHypothesisWithChildren,
  newHypothesisId: string
): Promise<void> => {
  if (hypothesis.canvasSectionLinks.length === 0) return

  await tx.hypothesisCanvasSection.createMany({
    data: hypothesis.canvasSectionLinks.map(section => ({
      hypothesisId: newHypothesisId,
      canvasElementType: section.canvasElementType
    }))
  })
}

const copyMetricWithThreshold = async (
  tx: Tx,
  hypothesis: PrismaHypothesisWithChildren,
  newHypothesisId: string
): Promise<void> => {
  if (hypothesis.metric === null) return

  await tx.metric.create({
    data: {
      hypothesisId: newHypothesisId,
      name: hypothesis.metric.name,
      description: hypothesis.metric.description,
      unit: hypothesis.metric.unit,
      threshold: hypothesis.metric.threshold
        ? {
            create: {
              operator: hypothesis.metric.threshold.operator,
              referenceValue: hypothesis.metric.threshold.referenceValue
            }
          }
        : undefined
    }
  })
}

const copyExperiment = async (
  tx: Tx,
  hypothesis: PrismaHypothesisWithChildren,
  newHypothesisId: string
): Promise<void> => {
  if (hypothesis.experiment === null) return

  await tx.experiment.create({
    data: {
      hypothesisId: newHypothesisId,
      title: hypothesis.experiment.title,
      description: hypothesis.experiment.description,
      status: hypothesis.experiment.status
    }
  })
}

const copyMeasurement = async (
  tx: Tx,
  hypothesis: PrismaHypothesisWithChildren,
  newHypothesisId: string
): Promise<void> => {
  if (hypothesis.measurement === null) return

  await tx.measurement.create({
    data: {
      hypothesisId: newHypothesisId,
      value: hypothesis.measurement.value,
      note: hypothesis.measurement.note
    }
  })
}

const copyHypothesisWithChildren = async (
  tx: Tx,
  hypothesis: PrismaHypothesisWithChildren,
  newVersionId: string
): Promise<void> => {
  const createdHypothesis = await tx.hypothesis.create({
    data: {
      ideaVersionId: newVersionId,
      statement: hypothesis.statement,
      dimension: hypothesis.dimension,
      priority: hypothesis.priority,
      evidenceType: hypothesis.evidenceType,
      status: hypothesis.status
    }
  })

  await copyHypothesisCanvasLinks(tx, hypothesis, createdHypothesis.id)
  await copyMetricWithThreshold(tx, hypothesis, createdHypothesis.id)
  await copyExperiment(tx, hypothesis, createdHypothesis.id)
  await copyMeasurement(tx, hypothesis, createdHypothesis.id)
}

const copyHypotheses = async (
  tx: Tx,
  baseVersion: PrismaBaseVersion,
  newVersionId: string,
  hypothesisIdsToCopy: Set<string>
): Promise<void> => {
  const hypothesesToCopy = baseVersion.hypotheses.filter(h => hypothesisIdsToCopy.has(h.id))

  for (const hypothesis of hypothesesToCopy) {
    await copyHypothesisWithChildren(tx, hypothesis, newVersionId)
  }
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const ideaVersionRepository: IdeaVersionRepository = {
  /**
   * Lists idea cards for one user. Each idea contains only its latest version.
   */
  async listByUser(input: IdeaVersionListInput): Promise<{ ideas: Idea[], total: number }> {
    const skip = (input.page - 1) * input.pageSize
    const where = buildIdeaWhere({ userId: input.userId, search: input.search })

    const [rows, total] = await prisma.$transaction([
      prisma.idea.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
        skip,
        take: input.pageSize
      }),
      prisma.idea.count({ where })
    ])

    return { ideas: rows.map(toDomainIdea), total }
  },

  /**
   * Loads the selected base version and hypothesis states needed for copy rules.
   * Returns null when the base version is not accessible to the user.
   */
  async getVersionSource(input: IdeaVersionOwnerInput): Promise<VersionSource | null> {
    const row = await prisma.ideaVersion.findFirst({
      where: {
        id: input.ideaVersionId,
        ideaId: input.ideaId,
        idea: { userId: input.userId }
      },
      select: {
        id: true,
        ideaId: true,
        parentVersionId: true,
        versionNumber: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        hypotheses: { select: { id: true, status: true } }
      }
    })

    if (row === null) return null

    return {
      baseVersion: toDomainIdeaVersion(row),
      hypotheses: row.hypotheses.map(h => ({ id: h.id, status: h.status }))
    }
  },

  /**
   * Creates a new version from a base version and copies selected snapshot data.
   * Returns null when the base version is not accessible to the user.
   */
  async createFromSource(input: CreateVersionFromSourceInput): Promise<IdeaVersion | null> {
    return prisma.$transaction(async (tx) => {
      const baseVersion = await loadOwnedBaseVersion(tx, input)
      if (baseVersion === null) return null

      const nextVersionNumber = await getNextVersionNumber(tx, input.ideaId)
      const createdVersion = await createDerivedVersion(tx, input, baseVersion, nextVersionNumber)

      await copyCanvasElements(tx, baseVersion, createdVersion.id)
      await copyHypotheses(tx, baseVersion, createdVersion.id, new Set(input.hypothesisIdsToCopy))

      return toDomainIdeaVersion(createdVersion)
    })
  }
}
