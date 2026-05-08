import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendVerificationMail } from '../../server/infrastructure/mail/send-verification-mail'

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
  beforeEach(() => {
    vi.clearAllMocks()
    sendMailMock.mockResolvedValue(undefined)
    buildVerificationMailContentMock.mockReturnValue({
      subject: 'Verify your email',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it('uses english as default locale when no locale is provided', async () => {
    await sendVerificationMail({
      to: 'user@example.com',
      verifyUrl: 'https://example.com/verify?token=abc'
    })

    expect(buildVerificationMailContentMock).toHaveBeenCalledWith('https://example.com/verify?token=abc', 'en')
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@example.com',
      to: 'user@example.com',
      subject: 'Verify your email',
      text: 'Plain text email',
      html: '<p>HTML email</p>'
    })
  })

  it('uses provided locale for content generation', async () => {
    await sendVerificationMail({
      to: 'user@example.com',
      verifyUrl: 'https://example.com/verify?token=abc',
      locale: 'de'
    })

    expect(buildVerificationMailContentMock).toHaveBeenCalledWith('https://example.com/verify?token=abc', 'de')
  })

  it('propagates transporter errors', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP unavailable'))

    await expect(sendVerificationMail({
      to: 'user@example.com',
      verifyUrl: 'https://example.com/verify?token=abc',
      locale: 'en'
    })).rejects.toThrow('SMTP unavailable')
  })
})
