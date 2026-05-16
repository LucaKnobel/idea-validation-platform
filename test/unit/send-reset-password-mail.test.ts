import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendResetPasswordMail } from '@infrastructure/mail/send-reset-password-mail'

const { sendMailMock, buildResetPasswordMailContentMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  buildResetPasswordMailContentMock: vi.fn()
}))

vi.mock('@infrastructure/mail/mail-transporter', () => ({
  getMailConfig: vi.fn(() => ({
    from: 'no-reply@example.com'
  })),
  getMailTransporter: vi.fn(() => ({
    sendMail: sendMailMock
  }))
}))

vi.mock('@infrastructure/mail/reset-password-mail-content', () => ({
  buildResetPasswordMailContent: buildResetPasswordMailContentMock
}))

describe('sendResetPasswordMail', () => {
  const resetUrl = 'https://example.com/reset-password?token=abc'

  beforeEach(() => {
    vi.clearAllMocks()
    sendMailMock.mockResolvedValue(undefined)
    buildResetPasswordMailContentMock.mockReturnValue({
      subject: 'Reset your password',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it.each([
    {
      title: 'uses english as default locale when no locale is provided',
      payload: {
        to: 'user@example.com',
        resetUrl
      },
      expectedLocale: 'en'
    },
    {
      title: 'uses provided locale for content generation',
      payload: {
        to: 'user@example.com',
        resetUrl,
        locale: 'de' as const
      },
      expectedLocale: 'de'
    }
  ])('$title', async ({ payload, expectedLocale }) => {
    await sendResetPasswordMail(payload)

    expect(buildResetPasswordMailContentMock).toHaveBeenCalledWith(resetUrl, expectedLocale)
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'user@example.com',
      subject: 'Reset your password',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it('propagates transporter errors', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    await expect(sendResetPasswordMail({
      to: 'user@example.com',
      resetUrl,
      locale: 'en'
    })).rejects.toThrow('SMTP unavailable')
  })
})
