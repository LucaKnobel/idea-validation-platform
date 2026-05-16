import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  getE2ESetupOptions,
  password,
  postRegister,
  postRequestPasswordReset,
  postResetPassword,
  postSignIn
} from './auth-test-helpers'

beforeEach(clearAuthTables)

const createVerifiedUser = async () => {
  const email = `reset-password-${randomUUID()}@example.com`

  const registerResponse = await postRegister({
    email,
    password,
    name: 'Reset Password Test User',
    callbackURL: '/auth/login'
  })

  expect(registerResponse.status).toBe(200)

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true }
  })

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true }
  })

  expect(user).not.toBeNull()
  return user!
}

const requestResetToken = async (email: string, userId: string) => {
  const response = await postRequestPasswordReset({
    email,
    redirectTo: '/auth/reset-password'
  })

  expect(response.status).toBe(200)

  const verification = await prisma.verification.findFirst({
    where: {
      identifier: {
        startsWith: 'reset-password:'
      },
      value: userId
    }
  })

  expect(verification).not.toBeNull()
  const token = verification?.identifier.slice('reset-password:'.length) ?? ''
  expect(token).toBeTruthy()

  return {
    response,
    token
  }
}

describe('Reset password flow', async () => {
  await setup(getE2ESetupOptions())

  it('resets the password with a valid token', async () => {
    const user = await createVerifiedUser()
    const newPassword = 'NewStrongPassword1!'

    const { token } = await requestResetToken(user.email, user.id)
    const resetResponse = await postResetPassword({
      newPassword,
      token
    })

    expect(resetResponse.status).toBe(200)

    const signInResponse = await postSignIn({
      email: user.email,
      password: newPassword,
      rememberMe: true
    })

    expect(signInResponse.status).toBe(200)
  })

  it('rejects an invalid token', async () => {
    const user = await createVerifiedUser()

    const response = await postResetPassword({
      newPassword: 'NewStrongPassword1!',
      token: `invalid-${randomUUID()}`
    })

    expect(response.status).toBe(400)

    const body = await response.json() as { code?: string }
    expect(body.code).toBe('INVALID_TOKEN')

    const oldPasswordLogin = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(oldPasswordLogin.status).toBe(200)
  })

  it('rejects an expired token', async () => {
    const user = await createVerifiedUser()
    const expiredToken = `expired-${randomUUID()}`

    await prisma.verification.create({
      data: {
        id: randomUUID(),
        identifier: `reset-password:${expiredToken}`,
        value: user.id,
        expiresAt: new Date(Date.now() - 60_000)
      }
    })

    const response = await postResetPassword({
      newPassword: 'NewStrongPassword1!',
      token: expiredToken
    })

    expect(response.status).toBe(400)

    const body = await response.json() as { code?: string }
    expect(body.code).toBe('INVALID_TOKEN')
  })

  it('allows a reset token to be used only once', async () => {
    const user = await createVerifiedUser()
    const newPassword = 'NewStrongPassword1!'
    const { token } = await requestResetToken(user.email, user.id)

    const firstResetResponse = await postResetPassword({
      newPassword,
      token
    })

    expect(firstResetResponse.status).toBe(200)

    const secondResetResponse = await postResetPassword({
      newPassword: 'AnotherStrongPassword1!',
      token
    })

    expect(secondResetResponse.status).toBe(400)

    const body = await secondResetResponse.json() as { code?: string }
    expect(body.code).toBe('INVALID_TOKEN')
  })

  it('disables the old password and accepts the new password after reset', async () => {
    const user = await createVerifiedUser()
    const newPassword = 'NewStrongPassword1!'
    const { token } = await requestResetToken(user.email, user.id)

    const resetResponse = await postResetPassword({
      newPassword,
      token
    })

    expect(resetResponse.status).toBe(200)

    const oldPasswordLogin = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(oldPasswordLogin.status).toBe(401)

    const newPasswordLogin = await postSignIn({
      email: user.email,
      password: newPassword,
      rememberMe: true
    })

    expect(newPasswordLogin.status).toBe(200)
  })
})
