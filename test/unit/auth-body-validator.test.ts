import { describe, expect, it } from 'vitest'
import {
  InvalidAuthRequestBodyError,
  UnsupportedAuthRequestBodyError,
  validateAuthRequestBody
} from '../../server/infrastructure/auth/auth-body-validator'

describe('validateAuthRequestBody', () => {
  it('returns undefined when request has no body', () => {
    const result = validateAuthRequestBody('/sign-in/email', undefined)

    expect(result).toBeUndefined()
  })

  it('throws UnsupportedAuthRequestBodyError for unknown auth endpoint with body', () => {
    expect(() => validateAuthRequestBody('/reset-password', { email: 'user@example.com' })).toThrow(UnsupportedAuthRequestBodyError)
  })

  it('throws InvalidAuthRequestBodyError with issues for malformed sign-in payload', () => {
    try {
      validateAuthRequestBody('/sign-in/email', {
        email: 'invalid-email',
        password: 'short'
      })
      expect.unreachable('Expected InvalidAuthRequestBodyError to be thrown')
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(InvalidAuthRequestBodyError)
      const invalidError = error as InvalidAuthRequestBodyError
      expect(invalidError.issues.length).toBeGreaterThan(0)
      expect(invalidError.issues.some(issue => issue.path === 'email')).toBe(true)
    }
  })

  it('returns normalized data for valid sign-in payload', () => {
    const result = validateAuthRequestBody('/sign-in/email', {
      email: '  User@Example.COM  ',
      password: 'VeryStrongPassword1!',
      rememberMe: false,
      callbackURL: '/dashboard'
    })

    expect(result?.email).toBe('user@example.com')
    expect(result?.rememberMe).toBe(false)
    expect(result?.callbackURL).toBe('/dashboard')
  })
})
