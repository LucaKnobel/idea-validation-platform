import { describe, expect, it } from 'vitest'
import {
  LoginUserBodySchema,
  RegisterUserBodySchema,
  RequestPasswordResetBodySchema,
  ResetPasswordBodySchema,
  SendVerificationEmailBodySchema
} from '../../server/infrastructure/auth/auth-schemas'

// Shared valid values
const VALID_EMAIL = 'user@example.com'
const VALID_PASSWORD = 'VeryStrongPassword1!'
const VALID_CALLBACK_URL = '/dashboard'

describe('LoginUserBodySchema', () => {
  it('accepts valid input', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
  })

  it('normalizes email (trims whitespace and lowercases)', () => {
    const result = LoginUserBodySchema.safeParse({
      email: '  User@Example.COM  ',
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email', () => {
    const result = LoginUserBodySchema.safeParse({
      email: 'invalid-email',
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = LoginUserBodySchema.safeParse({ password: VALID_PASSWORD })

    expect(result.success).toBe(false)
  })

  it('accepts password shorter than 15 characters (no policy check at login)', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'Short1!'
    })

    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: ''
    })

    expect(result.success).toBe(false)
  })

  it('rejects password exceeding 256 characters', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'A'.repeat(257)
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing password', () => {
    const result = LoginUserBodySchema.safeParse({ email: VALID_EMAIL })

    expect(result.success).toBe(false)
  })

  it('accepts optional fields omitted', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rememberMe).toBeUndefined()
      expect(result.data.callbackURL).toBeUndefined()
    }
  })

  it('accepts rememberMe true and relative callbackURL', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      rememberMe: true,
      callbackURL: VALID_CALLBACK_URL
    })

    expect(result.success).toBe(true)
  })

  it('accepts rememberMe false', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      rememberMe: false
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-boolean rememberMe', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      rememberMe: 'false'
    })

    expect(result.success).toBe(false)
  })

  it('rejects absolute callbackURL', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })

  it('rejects protocol-relative callbackURL', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: '//dashboard'
    })

    expect(result.success).toBe(false)
  })

  it('rejects callbackURL exceeding 2048 characters', () => {
    const result = LoginUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: `/${'a'.repeat(2048)}`
    })

    expect(result.success).toBe(false)
  })
})

describe('RegisterUserBodySchema', () => {
  it('accepts valid input', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
  })

  it('normalizes email (trims whitespace and lowercases)', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: '  User@Example.COM  ',
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'invalid-email',
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = RegisterUserBodySchema.safeParse({ password: VALID_PASSWORD })

    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 15 characters', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'Short1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password exceeding 256 characters', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: `${'A'.repeat(200)}aaaaaa1!bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase letter', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'verystrongpassword1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase letter', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'VERYSTRONGPASSWORD1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'VeryStrongPassword!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: 'VeryStrongPassword1'
    })

    expect(result.success).toBe(false)
  })

  it('accepts optional callbackURL omitted', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.callbackURL).toBeUndefined()
    }
  })

  it('accepts relative callbackURL', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: '/auth/login'
    })

    expect(result.success).toBe(true)
  })

  it('rejects absolute callbackURL', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })

  it('rejects protocol-relative callbackURL', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: '//dashboard'
    })

    expect(result.success).toBe(false)
  })

  it('rejects callbackURL exceeding 2048 characters', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      callbackURL: `/${'a'.repeat(2048)}`
    })

    expect(result.success).toBe(false)
  })
})

describe('SendVerificationEmailBodySchema', () => {
  it('accepts valid input', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL
    })

    expect(result.success).toBe(true)
  })

  it('normalizes email (trims whitespace and lowercases)', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: '  User@Example.COM  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: 'invalid-email'
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = SendVerificationEmailBodySchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('accepts optional callbackURL omitted', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.callbackURL).toBeUndefined()
    }
  })

  it('accepts relative callbackURL', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL,
      callbackURL: '/auth/login'
    })

    expect(result.success).toBe(true)
  })

  it('rejects absolute callbackURL', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL,
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })

  it('rejects protocol-relative callbackURL', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL,
      callbackURL: '//dashboard'
    })

    expect(result.success).toBe(false)
  })

  it('rejects callbackURL exceeding 2048 characters', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: VALID_EMAIL,
      callbackURL: `/${'a'.repeat(2048)}`
    })

    expect(result.success).toBe(false)
  })
})

describe('RequestPasswordResetBodySchema', () => {
  it('accepts valid input', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL
    })

    expect(result.success).toBe(true)
  })

  it('normalizes email (trims whitespace and lowercases)', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: '  User@Example.COM  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: 'invalid-email'
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = RequestPasswordResetBodySchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('accepts optional redirectTo omitted', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.redirectTo).toBeUndefined()
    }
  })

  it('accepts https redirectTo URL', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: 'https://example.com/reset-password'
    })

    expect(result.success).toBe(true)
  })

  it('accepts http redirectTo URL', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: 'http://example.com/reset-password'
    })

    expect(result.success).toBe(true)
  })

  it('rejects redirectTo with invalid protocol', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: 'ftp://example.com/reset-password'
    })

    expect(result.success).toBe(false)
  })

  it('rejects redirectTo that is not a URL', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: 'not-a-url'
    })

    expect(result.success).toBe(false)
  })

  it('rejects redirectTo that is a relative path', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: '/reset-password'
    })

    expect(result.success).toBe(false)
  })

  it('rejects redirectTo exceeding 2048 characters', () => {
    const result = RequestPasswordResetBodySchema.safeParse({
      email: VALID_EMAIL,
      redirectTo: `https://example.com/${'a'.repeat(2040)}`
    })

    expect(result.success).toBe(false)
  })
})

describe('ResetPasswordBodySchema', () => {
  it('accepts valid input', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: VALID_PASSWORD,
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(true)
  })

  it('trims token whitespace', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: VALID_PASSWORD,
      token: '  some-valid-reset-token  '
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.token).toBe('some-valid-reset-token')
    }
  })

  it('rejects password shorter than 15 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: 'Short1!',
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password exceeding 256 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: `${'A'.repeat(200)}aaaaaa1!bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb`,
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase letter', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: 'verystrongpassword1!',
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase letter', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: 'VERYSTRONGPASSWORD1!',
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: 'VeryStrongPassword!',
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: 'VeryStrongPassword1',
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty token', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: VALID_PASSWORD,
      token: ''
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing token', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: VALID_PASSWORD
    })

    expect(result.success).toBe(false)
  })

  it('rejects token exceeding 512 characters', () => {
    const result = ResetPasswordBodySchema.safeParse({
      newPassword: VALID_PASSWORD,
      token: 'a'.repeat(513)
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing newPassword', () => {
    const result = ResetPasswordBodySchema.safeParse({
      token: 'some-valid-reset-token'
    })

    expect(result.success).toBe(false)
  })
})
