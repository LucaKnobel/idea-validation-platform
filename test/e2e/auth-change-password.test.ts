import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setup } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'

import {
  clearAuthTables,
  createRegisteredAuthUser,
  expectAuthFailure,
  expectNoSessionCookie,
  expectRegisteredAuthUserCreated,
  extractAuthSessionCookieHeader,
  getE2ESetupOptions,
  password,
  postChangePassword,
  postSignIn
} from './auth-test-helpers'

beforeEach(clearAuthTables)
afterEach(clearAuthTables)

describe('Change password flow', async () => {
  await setup(getE2ESetupOptions())

  it('changes the password for an authenticated user', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'change-password',
      name: 'Change Password Test User',
      verified: true
    })
    const user = expectRegisteredAuthUserCreated(registrationResult)
    const newPassword = 'NewStrongPassword1!'

    const firstSignInResponse = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(firstSignInResponse.status).toBe(200)

    const secondSignInResponse = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(secondSignInResponse.status).toBe(200)

    const currentSessionCookie = extractAuthSessionCookieHeader(firstSignInResponse.headers.get('set-cookie') ?? '')
    const otherSessionCookie = extractAuthSessionCookieHeader(secondSignInResponse.headers.get('set-cookie') ?? '')

    expect(currentSessionCookie).toBeTruthy()
    expect(otherSessionCookie).toBeTruthy()

    const sessionsBeforeChange = await prisma.session.count({
      where: { userId: user.id }
    })

    expect(sessionsBeforeChange).toBe(2)

    const changePasswordResponse = await postChangePassword(currentSessionCookie ?? '', {
      currentPassword: password,
      newPassword,
      revokeOtherSessions: true
    })

    expect(changePasswordResponse.status).toBe(200)

    const sessionsAfterChange = await prisma.session.count({
      where: { userId: user.id }
    })

    expect(sessionsAfterChange).toBe(1)

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

  it('rejects change password with wrong current password', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'change-password',
      name: 'Change Password Test User',
      verified: true
    })
    const user = expectRegisteredAuthUserCreated(registrationResult)

    const signInResponse = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(signInResponse.status).toBe(200)

    const sessionCookie = extractAuthSessionCookieHeader(signInResponse.headers.get('set-cookie') ?? '')
    expect(sessionCookie).toBeTruthy()

    const changePasswordResponse = await postChangePassword(sessionCookie ?? '', {
      currentPassword: 'WrongPassword1!',
      newPassword: 'NewStrongPassword1!',
      revokeOtherSessions: true
    })

    await expectAuthFailure(changePasswordResponse, 400, 'INVALID_PASSWORD')
    expectNoSessionCookie(changePasswordResponse)

    const oldPasswordLogin = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(oldPasswordLogin.status).toBe(200)
  })

  it('rejects change password for requests without an authenticated session', async () => {
    const registrationResult = await createRegisteredAuthUser({
      emailPrefix: 'change-password',
      name: 'Change Password Test User',
      verified: true
    })
    const user = expectRegisteredAuthUserCreated(registrationResult)

    const changePasswordResponse = await postChangePassword('', {
      currentPassword: password,
      newPassword: 'NewStrongPassword1!',
      revokeOtherSessions: true
    })

    await expectAuthFailure(changePasswordResponse, 401)

    const oldPasswordLogin = await postSignIn({
      email: user.email,
      password,
      rememberMe: true
    })

    expect(oldPasswordLogin.status).toBe(200)
  })
})
