import type { SubscriptionCancellationGateway } from '@application/interfaces/subscription-cancellation-gateway'
import { logger } from '@infrastructure/logging/logger'

const parseProviderSubscriptionId = (value: string): number => {
  const parsed = Number.parseInt(value, 10)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createError({
      statusCode: 500,
      statusText: 'Stored Payrexx subscription id is invalid'
    })
  }

  return parsed
}

export const payrexxSubscriptionCancellationGateway: SubscriptionCancellationGateway = {
  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const config = useRuntimeConfig()
    const instanceName = config.payrexxInstanceName
    const apiSecret = config.payrexxApiSecret
    const apiBaseUrl = config.payrexxApiBaseUrl

    if (!instanceName || !apiSecret || !apiBaseUrl) {
      throw createError({
        statusCode: 500,
        statusText: 'Payrexx API credentials are not configured'
      })
    }

    const subscriptionId = parseProviderSubscriptionId(providerSubscriptionId)
    const endpoint = `${apiBaseUrl}/Subscription/${subscriptionId}/?instance=${encodeURIComponent(instanceName)}`

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${apiSecret}`
      }
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      logger.error('Failed to cancel Payrexx subscription', {
        source: 'payrexx-subscription-cancellation-gateway',
        providerSubscriptionId,
        statusCode: response.status,
        responseBody: errorBody
      })

      throw createError({
        statusCode: 502,
        statusText: 'Failed to cancel subscription at Payrexx'
      })
    }
  }
}
