import { randomUUID } from 'node:crypto'
import { afterAll, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'

import { prisma } from '@infrastructure/db/prisma'
import { createAuthE2ESetupOptions } from './auth-test-helpers'

describe('Database smoke test', async () => {
  await setup(createAuthE2ESetupOptions())

  const testSuffix = randomUUID()
  const userId = `smoke-user-${testSuffix}`
  const userEmail = `smoke-${testSuffix}@example.com`

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: userEmail
      }
    })
  })

  it('DB connection works', async () => {
    const result = await prisma.$queryRawUnsafe<Array<{ ok: number }>>('SELECT 1 AS ok')

    expect(result[0]?.ok).toBe(1)
  })

  it('migration schema exists', async () => {
    const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = '_prisma_migrations'
      ) AS exists
    `)

    expect(result[0]?.exists).toBe(true)
  })

  it('simple insert works', async () => {
    const created = await prisma.user.create({
      data: {
        id: userId,
        name: 'Smoke Test User',
        email: userEmail
      }
    })

    expect(created.id).toBe(userId)
    expect(created.email).toBe(userEmail)
  })

  it('simple read works', async () => {
    const found = await prisma.user.findUnique({
      where: {
        email: userEmail
      }
    })

    expect(found).not.toBeNull()
    expect(found?.id).toBe(userId)
    expect(found?.name).toBe('Smoke Test User')
  })
})
