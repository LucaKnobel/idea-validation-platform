import nodemailer, { type Transporter } from 'nodemailer'
import { useRuntimeConfig } from '#imports'

export type MailLocale = 'de' | 'en'

export interface VerificationMailInput {
  to: string
  verifyUrl: string
  locale?: MailLocale
}

let transporter: Transporter | null = null

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

interface MailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

const getMailConfig = (): MailConfig => {
  const config = useRuntimeConfig()
  const host = requiredValue('smtpHost', config.smtpHost as string | undefined)
  const port = Number(config.smtpPort ?? 587)
  const secure = parseBoolean(config.smtpSecure as string | boolean | undefined) || port === 465
  const user = requiredValue('smtpUser', config.smtpUser as string | undefined)
  const pass = requiredValue('smtpPass', config.smtpPass as string | undefined)
  const from = requiredValue('smtpFrom', config.smtpFrom as string | undefined)

  return { host, port, secure, user, pass, from }
}

const getTransporter = (): Transporter => {
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

const emailHtmlWrapper = (content: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Idea Validation Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">You received this email because you signed up. If you did not create an account, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

const buildVerificationContent = (verifyUrl: string, locale: MailLocale): { subject: string, text: string, html: string } => {
  if (locale === 'de') {
    return {
      subject: 'Bitte bestätige deine E-Mail-Adresse',
      text: `Willkommen bei der Idea Validation Platform!\n\nBitte bestätige deine E-Mail-Adresse mit folgendem Link:\n${verifyUrl}\n\nDer Link ist 24 Stunden gültig.\n\nFalls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.`,
      html: emailHtmlWrapper(`
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">E-Mail-Adresse bestätigen</h1>
        <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">Willkommen! Um dein Konto zu aktivieren, klicke bitte auf den Button unten.</p>
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
          <tr>
            <td style="border-radius:8px;background-color:#4f46e5;">
              <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">E-Mail bestätigen</a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">Oder kopiere diesen Link in deinen Browser:</p>
        <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;background:#f4f4f5;padding:10px 12px;border-radius:6px;">${verifyUrl}</p>
        <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">Der Link ist <strong>24 Stunden</strong> gültig.</p>
      `)
    }
  }

  return {
    subject: 'Please verify your email address',
    text: `Welcome to the Idea Validation Platform!\n\nPlease verify your email address using the link below:\n${verifyUrl}\n\nThis link is valid for 24 hours.\n\nIf you did not create an account, you can safely ignore this email.`,
    html: emailHtmlWrapper(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">Verify your email address</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">Welcome! To activate your account, please click the button below.</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="border-radius:8px;background-color:#4f46e5;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">Verify email address</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">Or copy this link into your browser:</p>
      <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;background:#f4f4f5;padding:10px 12px;border-radius:6px;">${verifyUrl}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">This link is valid for <strong>24 hours</strong>.</p>
    `)
  }
}

export const resolveMailLocaleFromRequest = (request?: Request | null): MailLocale => {
  const acceptLanguage = request?.headers.get('accept-language')?.toLowerCase() ?? ''
  return acceptLanguage.includes('de') ? 'de' : 'en'
}

export const sendVerificationMail = async (input: VerificationMailInput): Promise<void> => {
  const { from } = getMailConfig()
  const content = buildVerificationContent(input.verifyUrl, input.locale ?? 'en')

  await getTransporter().sendMail({
    from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html
  })
}
