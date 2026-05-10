import { buildResetPasswordMailContent } from '@infrastructure/mail/reset-password-mail-content'
import { getMailConfig, getMailTransporter } from '@infrastructure/mail/mail-transporter'
import type { AppLocale } from '@shared/types/locale'

export interface ResetPasswordMailInput {
  to: string
  resetUrl: string
  locale?: AppLocale
}

export const sendResetPasswordMail = async (input: ResetPasswordMailInput): Promise<void> => {
  const { from } = getMailConfig()
  const content = buildResetPasswordMailContent(input.resetUrl, input.locale ?? 'en')

  await getMailTransporter().sendMail({
    from,
    to: input.to,
    subject: content.subject,
    text: content.text,
    html: content.html
  })
}
