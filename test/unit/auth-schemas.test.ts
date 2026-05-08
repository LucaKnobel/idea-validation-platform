import { describe, expect, it } from 'vitest'
import { LoginUserBodySchema, RegisterUserBodySchema, SendVerificationEmailBodySchema } from '../../server/infrastructure/auth/auth-schemas'

describe('LoginUserBodySchema', () => {
  it('accepts valid input and normalizes email', () => {
    const result = LoginUserBodySchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'VeryStrongPassword1!'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects invalid email', () => {
    const result = LoginUserBodySchema.safeParse({
      email: 'invalid-email',
      password: 'VeryStrongPassword1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 15 characters', () => {
    const result = LoginUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'Short1!'
    })

    expect(result.success).toBe(false)
  })

  it('accepts rememberMe and relative callbackURL', () => {
    const result = LoginUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword1!',
      rememberMe: false,
      callbackURL: '/dashboard'
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-relative callbackURL', () => {
    const result = LoginUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword1!',
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })
})

describe('RegisterUserBodySchema', () => {
  it('accepts valid input and normalizes email', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: '  User@Example.COM  ',
      password: 'VeryStrongPassword1!'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('user@example.com')
    }
  })

  it('rejects password without uppercase letter', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'verystrongpassword1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase letter', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VERYSTRONGPASSWORD1!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword!'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password without special character', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword1'
    })

    expect(result.success).toBe(false)
  })

  it('rejects password shorter than 15 characters', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'Short1!'
    })

    expect(result.success).toBe(false)
  })

  it('accepts relative callbackURL', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword1!',
      callbackURL: '/auth/login'
    })

    expect(result.success).toBe(true)
  })

  it('rejects non-relative callbackURL', () => {
    const result = RegisterUserBodySchema.safeParse({
      email: 'user@example.com',
      password: 'VeryStrongPassword1!',
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })
})

describe('SendVerificationEmailBodySchema', () => {
  it('accepts valid payload and normalizes email', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: '  User@Example.COM  ',
      callbackURL: '/auth/login'
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

  it('rejects non-relative callbackURL', () => {
    const result = SendVerificationEmailBodySchema.safeParse({
      email: 'user@example.com',
      callbackURL: 'https://example.com/callback'
    })

    expect(result.success).toBe(false)
  })
})
