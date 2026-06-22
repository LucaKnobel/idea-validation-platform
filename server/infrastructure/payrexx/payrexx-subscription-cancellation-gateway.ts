import type { SubscriptionCancellationGateway } from '@application/interfaces/subscription-cancellation-gateway'
import { logger } from '@infrastructure/logging/logger'

/**
 * Converts the stored provider ID into the format Payrexx requires.
 * A non-numeric value means local subscription data is inconsistent.
 */
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

/**
 * Cancels a subscription at Payrexx.
 * Keeps provider-specific HTTP details out of the application layer.
 */
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
        'accept': 'application/json',
        'x-api-key': apiSecret
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
