import * as z from 'zod'

export const LoginUserBodySchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email address')),
  password: z.string()
    .min(15, 'Password must be at least 15 characters')
    .max(256, 'Password must not exceed 256 characters')
})

export const RegisterUserBodySchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .pipe(z.email('Invalid email address')),
  password: z.string()
    .min(15, 'Password must be at least 15 characters')
    .max(256, 'Password must not exceed 256 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
})

export type LoginUserBodyDto = z.infer<typeof LoginUserBodySchema>
export type RegisterUserBodyDto = z.infer<typeof RegisterUserBodySchema>
