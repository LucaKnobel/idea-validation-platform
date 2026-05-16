import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendVerificationMail } from '@infrastructure/mail/send-verification-mail'

const { sendMailMock, buildVerificationMailContentMock } = vi.hoisted(() => ({
  sendMailMock: vi.fn(),
  buildVerificationMailContentMock: vi.fn()
}))

vi.mock('@infrastructure/mail/mail-transporter', () => ({
  getMailConfig: vi.fn(() => ({
    from: 'no-reply@example.com'
  })),
  getMailTransporter: vi.fn(() => ({
    sendMail: sendMailMock
  }))
}))

vi.mock('@infrastructure/mail/verification-mail-content', () => ({
  buildVerificationMailContent: buildVerificationMailContentMock
}))

describe('sendVerificationMail', () => {
  const verifyUrl = 'https://example.com/verify?token=abc'

  beforeEach(() => {
    vi.clearAllMocks()
    sendMailMock.mockResolvedValue(undefined)
    buildVerificationMailContentMock.mockReturnValue({
      subject: 'Verify your email',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it.each([
    {
      title: 'uses english as default locale when no locale is provided',
      payload: {
        to: 'user@example.com',
        verifyUrl
      },
      expectedLocale: 'en'
    },
    {
      title: 'uses provided locale for content generation',
      payload: {
        to: 'user@example.com',
        verifyUrl,
        locale: 'de' as const
      },
      expectedLocale: 'de'
    }
  ])('$title', async ({ payload, expectedLocale }) => {
    await sendVerificationMail(payload)

    expect(buildVerificationMailContentMock).toHaveBeenCalledWith(verifyUrl, expectedLocale)
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'user@example.com',
      subject: 'Verify your email',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it('propagates transporter errors', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    await expect(sendVerificationMail({
      to: 'user@example.com',
      verifyUrl,
      locale: 'en'
    })).rejects.toThrow('SMTP unavailable')
  })
})
