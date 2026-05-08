import { buildVerificationMailContent } from '@infrastructure/mail/verification-mail-content'
import { getMailConfig, getMailTransporter } from '@infrastructure/mail/mail-transporter'
import type { AppLocale } from '@shared/types/locale'

export interface VerificationMailInput {
  to: string
  verifyUrl: string
  locale?: AppLocale
}

export type { AppLocale as MailLocale }

export const sendVerificationMail = async (input: VerificationMailInput): Promise<void> => {
  const { from } = getMailConfig()
  const content = buildVerificationMailContent(input.verifyUrl, input.locale ?? 'en')

  await getMailTransporter().sendMail({
    from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html
  })
}
