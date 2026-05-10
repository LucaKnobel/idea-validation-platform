import type { AppLocale } from '@shared/types/locale'
import { type MailCopy, wrapEmailHtml } from '@infrastructure/mail/mail-template'

export interface VerificationMailContent {
  subject: string
  text: string
  html: string
}

const verificationMailCopy: Record<AppLocale, MailCopy> = {
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

export const buildVerificationMailContent = (verifyUrl: string, locale: AppLocale): VerificationMailContent => {
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
    `, copy)
  }
}
