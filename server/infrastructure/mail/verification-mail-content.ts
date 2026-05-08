import type { AppLocale } from '@shared/types/locale'

export type MailLocale = AppLocale

export interface VerificationMailContent {
  subject: string
  text: string
  html: string
}

interface MailCopy {
  htmlLang: MailLocale
  title: string
  footer: string
  subject: string
  text: string
  heading: string
  intro: string
  cta: string
  linkLabel: string
  validity: string
}

const verificationMailCopy: Record<MailLocale, MailCopy> = {
  de: {
    htmlLang: 'de',
    title: 'E-Mail-Bestätigung',
    footer: 'Du hast diese E-Mail erhalten, weil du dich registriert hast. Falls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.',
    subject: 'Bitte bestätige deine E-Mail-Adresse',
    text: 'Willkommen bei der Evidara!\n\nBitte bestätige deine E-Mail-Adresse mit folgendem Link:\n{{verifyUrl}}\n\nDer Link ist 1 Stunde gültig.\n\nFalls du kein Konto erstellt hast, kannst du diese E-Mail ignorieren.',
    heading: 'E-Mail-Adresse bestätigen',
    intro: 'Willkommen! Um dein Konto zu aktivieren, klicke bitte auf den Button unten.',
    cta: 'E-Mail bestätigen',
    linkLabel: 'Oder kopiere diesen Link in deinen Browser:',
    validity: 'Der Link ist <strong>1 Stunde</strong> gültig.'
  },
  en: {
    htmlLang: 'en',
    title: 'Email Verification',
    footer: 'You received this email because you signed up. If you did not create an account, you can safely ignore this email.',
    subject: 'Please verify your email address',
    text: 'Welcome to Evidara!\n\nPlease verify your email address using the link below:\n{{verifyUrl}}\n\nThis link is valid for 1 hour.\n\nIf you did not create an account, you can safely ignore this email.',
    heading: 'Verify your email address',
    intro: 'Welcome! To activate your account, please click the button below.',
    cta: 'Verify email address',
    linkLabel: 'Or copy this link into your browser:',
    validity: 'This link is valid for <strong>1 hour</strong>.'
  }
}

const wrapEmailHtml = (content: string, locale: MailLocale): string => {
  const copy = verificationMailCopy[locale]

  return `<!DOCTYPE html>
<html lang="${copy.htmlLang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${copy.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:#4f46e5;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Evidara</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">${copy.footer}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export const buildVerificationMailContent = (verifyUrl: string, locale: MailLocale): VerificationMailContent => {
  const copy = verificationMailCopy[locale]

  return {
    subject: copy.subject,
    text: copy.text.replace('{{verifyUrl}}', verifyUrl),
    html: wrapEmailHtml(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">${copy.heading}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">${copy.intro}</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="border-radius:8px;background-color:#4f46e5;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${copy.cta}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">${copy.linkLabel}</p>
      <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;background:#f4f4f5;padding:10px 12px;border-radius:6px;">${verifyUrl}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">${copy.validity}</p>
    `, locale)
  }
}
