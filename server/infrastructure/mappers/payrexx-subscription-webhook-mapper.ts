import type { SubscriptionStatus } from '@application/models/subscription'
import type {
  SyncSubscriptionByProviderInput,
  SyncSubscriptionInput
} from '@application/services/build-subscription-webhook-sync-service'
import type { PayrexxSubscriptionWebhook } from '@infrastructure/validation/payrexx-subscription-webhook'

/**
 * Maps Payrexx status strings to internal subscription status values.
 */
const mapPayrexxStatus = (
  status: PayrexxSubscriptionWebhook['status']
): SubscriptionStatus => {
  switch (status) {
    case 'active':
      return 'ACTIVE'
    case 'in_notice':
      return 'IN_NOTICE'
    case 'overdue':
      return 'OVERDUE'
    case 'failed':
      return 'FAILED'
    case 'cancelled':
      return 'CANCELLED'
    default:
      return 'FAILED'
  }
}

/**
 * Parses optional Payrexx date strings and normalizes invalid values to null.
 */
const parsePayrexxDate = (value: string | null): Date | null => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Converts the validated Payrexx webhook payload into the use-case input model.
 * userId and checkoutId must be resolved server-side before calling this.
 */
export const mapPayrexxWebhookToSyncSubscriptionInput = (
  webhook: PayrexxSubscriptionWebhook,
  userId: string,
  checkoutId: string
): SyncSubscriptionInput => {
  return {
    userId,
    checkoutId,
    status: mapPayrexxStatus(webhook.status),
    providerCustomerId: webhook.contact.uuid,
    providerSubscriptionId: String(webhook.id),
    currentPeriodEnd: parsePayrexxDate(webhook.end ?? webhook.valid_until)
  }
}

/**
 * Converts validated Payrexx webhook payload into provider-identifier based sync input.
 */
export const mapPayrexxWebhookToProviderSyncInput = (
  webhook: PayrexxSubscriptionWebhook
): SyncSubscriptionByProviderInput => {
  return {
    status: mapPayrexxStatus(webhook.status),
    providerCustomerId: webhook.contact.uuid,
    providerSubscriptionId: String(webhook.id),
    currentPeriodEnd: parsePayrexxDate(webhook.end ?? webhook.valid_until)
  }
}
