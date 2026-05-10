import type { AppLocale } from '@shared/types/locale'
import { type MailCopy, wrapEmailHtml } from '@infrastructure/mail/mail-template'

export interface ResetPasswordMailContent {
  subject: string
  text: string
  html: string
}

const resetPasswordMailCopy: Record<AppLocale, MailCopy> = {
  de: {
    htmlLang: 'de',
    title: 'Passwort zurücksetzen',
    footer: 'Du hast diese E-Mail erhalten, weil du ein neues Passwort angefordert hast. Falls das nicht von dir war, kannst du diese E-Mail ignorieren.',
    subject: 'Setze dein Passwort zurück',
    text: 'Du kannst dein Passwort mit folgendem Link zurücksetzen:\n{{resetUrl}}\n\nDer Link ist 1 Stunde gültig.\n\nFalls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.',
    heading: 'Passwort zurücksetzen',
    intro: 'Klicke auf den Button unten, um ein neues Passwort für dein Konto zu vergeben.',
    cta: 'Passwort zurücksetzen',
    linkLabel: 'Oder kopiere diesen Link in deinen Browser:',
    validity: 'Der Link ist <strong>1 Stunde</strong> gültig.'
  },
  en: {
    htmlLang: 'en',
    title: 'Reset Password',
    footer: 'You received this email because a password reset was requested for your account. If this was not you, you can safely ignore this email.',
    subject: 'Reset your password',
    text: 'You can reset your password using the link below:\n{{resetUrl}}\n\nThis link is valid for 1 hour.\n\nIf you did not request this, you can safely ignore this email.',
    heading: 'Reset your password',
    intro: 'Click the button below to set a new password for your account.',
    cta: 'Reset password',
    linkLabel: 'Or copy this link into your browser:',
    validity: 'This link is valid for <strong>1 hour</strong>.'
  }
}

export const buildResetPasswordMailContent = (resetUrl: string, locale: AppLocale): ResetPasswordMailContent => {
  const copy = resetPasswordMailCopy[locale]

  return {
    subject: copy.subject,
    text: copy.text.replace('{{resetUrl}}', resetUrl),
    html: wrapEmailHtml(`
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;letter-spacing:-0.3px;">${copy.heading}</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">${copy.intro}</p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 28px;">
        <tr>
          <td style="border-radius:8px;background-color:#4f46e5;">
            <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;">${copy.cta}</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#a1a1aa;">${copy.linkLabel}</p>
      <p style="margin:0;font-size:12px;color:#71717a;word-break:break-all;background:#f4f4f5;padding:10px 12px;border-radius:6px;">${resetUrl}</p>
      <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;">${copy.validity}</p>
    `, copy)
  }
}
