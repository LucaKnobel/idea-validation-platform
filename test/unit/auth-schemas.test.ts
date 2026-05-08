import { describe, expect, it } from 'vitest'
import { LoginUserBodySchema, RegisterUserBodySchema } from '../../server/infrastructure/auth/auth-schemas'

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
})
