import {
  LoginUserBodySchema,
  RegisterUserBodySchema,
  ResetPasswordBodySchema,
  RequestPasswordResetBodySchema,
  SendVerificationEmailBodySchema
} from './auth-schemas'
import type {
  LoginUserBodyDto,
  RegisterUserBodyDto,
  ResetPasswordBodyDto,
  RequestPasswordResetBodyDto,
  SendVerificationEmailBodyDto
} from './auth-schemas'

type ParsedAuthBody = LoginUserBodyDto
  | RegisterUserBodyDto
  | SendVerificationEmailBodyDto
  | RequestPasswordResetBodyDto
  | ResetPasswordBodyDto

export interface ValidationIssue {
  path: string
  code: string
}

export class UnsupportedAuthRequestBodyError extends Error {
  constructor() {
    super('Unsupported auth request body')
    this.name = 'UnsupportedAuthRequestBodyError'
  }
}

export class InvalidAuthRequestBodyError extends Error {
  readonly issues: ValidationIssue[]

  constructor(issues: ValidationIssue[]) {
    super('Invalid auth payload')
    this.name = 'InvalidAuthRequestBodyError'
    this.issues = issues
  }
}

const SCHEMA_BY_PATH = {
  '/sign-up/email': RegisterUserBodySchema,
  '/sign-in/email': LoginUserBodySchema,
  '/send-verification-email': SendVerificationEmailBodySchema,
  '/request-password-reset': RequestPasswordResetBodySchema,
  '/reset-password': ResetPasswordBodySchema
} as const

const NO_BODY_PATHS = new Set<string>([
  '/sign-out'
])

export const validateAuthRequestBody = (path: string, body: unknown): ParsedAuthBody | undefined => {
  if (typeof body === 'undefined') {
    return undefined
  }

  if (NO_BODY_PATHS.has(path)) {
    return undefined
  }

  const schema = SCHEMA_BY_PATH[path as keyof typeof SCHEMA_BY_PATH]

  if (!schema) {
    throw new UnsupportedAuthRequestBodyError()
  }

  const parsedBody = schema.safeParse(body)

  if (!parsedBody.success) {
    throw new InvalidAuthRequestBodyError(
      parsedBody.error.issues.map(issue => ({
        path: issue.path.join('.'),
        code: issue.code
      }))
    )
  }

  return parsedBody.data
}
