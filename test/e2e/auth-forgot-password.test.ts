import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createRegisteredAuthUser,
  expectRegisteredAuthUserCreated,
  getE2ESetupOptions,
  postRequestPasswordReset
} from './auth-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('Forgot password flow', async () => {
  await setup(getE2ESetupOptions())

  it('accepts a password reset request for an existing user', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'forgot-password',
      name: 'Forgot Password Test User'
    })
    const user = expectRegisteredAuthUserCreated(registrationResult)

    const response = await postRequestPasswordReset({
      email: user.email,
      redirectTo: '/auth/reset-password'
    })

    expect(response.status).toBe(200)

    const body = await response.json() as { status?: boolean, message?: string }
    expect(body.status).toBe(true)
    expect(body.message).toBeTruthy()
  })

  it('generates and persists a reset token for an existing user', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'forgot-password',
      name: 'Forgot Password Test User'
    })
    const user = expectRegisteredAuthUserCreated(registrationResult)

    const response = await postRequestPasswordReset({
      email: user.email,
      redirectTo: '/auth/reset-password'
    })

    expect(response.status).toBe(200)

    const verification = await prisma.verification.findFirst({
      where: {
        identifier: {
          startsWith: 'reset-password:'
        },
        value: user.id
      }
    })

    expect(verification).not.toBeNull()
    expect(verification?.identifier).toMatch(/^reset-password:[A-Za-z0-9]+$/)
    expect(verification?.identifier.length).toBeGreaterThan('reset-password:'.length)
    expect(verification?.value).toBe(user.id)
    expect(verification?.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })

  it('returns the same generic response for an unknown email', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'forgot-password',
      name: 'Forgot Password Test User'
    })
    const knownUser = expectRegisteredAuthUserCreated(registrationResult)

    const knownResponse = await postRequestPasswordReset({
      email: knownUser.email,
      redirectTo: '/auth/reset-password'
    })

    const knownBody = await knownResponse.json() as { status?: boolean, message?: string }

    const unknownResponse = await postRequestPasswordReset({
      email: `unknown-${randomUUID()}@example.com`,
      redirectTo: '/auth/reset-password'
    })

    expect(unknownResponse.status).toBe(200)

    const unknownBody = await unknownResponse.json() as { status?: boolean, message?: string }

    expect(unknownBody.status).toBe(true)
    expect(unknownBody.message).toBe(knownBody.message)
  })

  it('does not leak user enumeration via password reset responses', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'forgot-password',
      name: 'Forgot Password Test User'
    })
    const knownUser = expectRegisteredAuthUserCreated(registrationResult)

    const knownResponse = await postRequestPasswordReset({
      email: knownUser.email,
      redirectTo: '/auth/reset-password'
    })

    const unknownResponse = await postRequestPasswordReset({
      email: `unknown-${randomUUID()}@example.com`,
      redirectTo: '/auth/reset-password'
    })

    const knownBody = await knownResponse.json() as { status?: boolean, message?: string }
    const unknownBody = await unknownResponse.json() as { status?: boolean, message?: string }

    expect(knownResponse.status).toBe(200)
    expect(unknownResponse.status).toBe(200)
    expect(knownBody.message).toBe(unknownBody.message)
    expect(knownBody.status).toBe(unknownBody.status)
  })
})
