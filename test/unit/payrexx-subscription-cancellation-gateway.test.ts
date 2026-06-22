import { beforeEach, describe, expect, it, vi } from 'vitest'
import { payrexxSubscriptionCancellationGateway } from '@infrastructure/payrexx/payrexx-subscription-cancellation-gateway'

const state = vi.hoisted(() => ({
  loggerError: vi.fn()
}))

vi.mock('@infrastructure/logging/logger', () => ({
  logger: {
    error: state.loggerError
  }
}))

describe('payrexxSubscriptionCancellationGateway', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('createError', ({ statusCode, statusText }: { statusCode: number, statusText: string }) => {
      const error = new Error(statusText) as Error & { statusCode: number, statusText: string }
      error.statusCode = statusCode
      error.statusText = statusText
      return error
    })

    vi.stubGlobal('useRuntimeConfig', () => ({
      payrexxInstanceName: 'instance-1',
      payrexxApiSecret: 'secret-1',
      payrexxApiBaseUrl: 'https://api.payrexx.test/v1.16'
    }))

    vi.stubGlobal('fetch', vi.fn())
  })

  it('throws 500 when Payrexx config is missing', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      payrexxInstanceName: '',
      payrexxApiSecret: 'secret-1',
      payrexxApiBaseUrl: 'https://api.payrexx.test/v1.16'
    }))

    await expect(
      payrexxSubscriptionCancellationGateway.cancelSubscription('1234')
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  it('throws 500 when provider subscription id is invalid', async () => {
    await expect(
      payrexxSubscriptionCancellationGateway.cancelSubscription('not-a-number')
    ).rejects.toMatchObject({ statusCode: 500 })
  })

  it('sends DELETE request to Payrexx with encoded instance and api key', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: vi.fn().mockResolvedValue('')
    } as unknown as Response)

    await payrexxSubscriptionCancellationGateway.cancelSubscription('4321')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.payrexx.test/v1.16/Subscription/4321/?instance=instance-1',
      {
        method: 'DELETE',
        headers: {
          accept: 'application/json',
          'x-api-key': 'secret-1'
        }
      }
    )
  })

  it('logs and throws 502 when Payrexx returns non-ok response', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue('subscription not found')
    } as unknown as Response)

    await expect(
      payrexxSubscriptionCancellationGateway.cancelSubscription('4321')
    ).rejects.toMatchObject({ statusCode: 502 })

    expect(state.loggerError).toHaveBeenCalledWith('Failed to cancel Payrexx subscription', {
      source: 'payrexx-subscription-cancellation-gateway',
      providerSubscriptionId: '4321',
      statusCode: 404,
      responseBody: 'subscription not found'
    })
  })
})
