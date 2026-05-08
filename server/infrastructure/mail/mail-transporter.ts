import nodemailer, { type Transporter } from 'nodemailer'
import { useRuntimeConfig } from '#imports'

let transporter: Transporter | null = null

interface MailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const requiredValue = (key: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required runtime configuration value: ${key}`)
  }

  return value
}

const parseBoolean = (value: string | boolean | undefined): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  return value === 'true'
}

export const getMailConfig = (): MailConfig => {
  const config = useRuntimeConfig()
  const host = requiredValue('smtpHost', config.smtpHost as string | undefined)
  const port = Number(config.smtpPort ?? 587)
  const secure = parseBoolean(config.smtpSecure as string | boolean | undefined) || port === 465
  const user = requiredValue('smtpUser', config.smtpUser as string | undefined)
  const pass = requiredValue('smtpPass', config.smtpPass as string | undefined)
  const from = requiredValue('smtpFrom', config.smtpFrom as string | undefined)

  return { host, port, secure, user, pass, from }
}

export const getMailTransporter = (): Transporter => {
  if (transporter) {
    return transporter
  }

  const { host, port, secure, user, pass } = getMailConfig()

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: port === 587,
    auth: {
      user,
      pass
    }
  })

  return transporter
}
