import type { SubscriptionStatus } from '@application/models/subscription'
import type {
  SubscriptionUpsertByProviderInput,
  SubscriptionUpsertByCheckoutInput
} from '@application/interfaces/subscription-webhook-sync-service'
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
export const mapPayrexxWebhookToCheckoutUpsertInput = (
  webhook: PayrexxSubscriptionWebhook,
  userId: string,
  checkoutId: string
): SubscriptionUpsertByCheckoutInput => {
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
export const mapPayrexxWebhookToProviderUpsertInput = (
  webhook: PayrexxSubscriptionWebhook
): SubscriptionUpsertByProviderInput => {
  return {
    status: mapPayrexxStatus(webhook.status),
    providerCustomerId: webhook.contact.uuid,
    providerSubscriptionId: String(webhook.id),
    currentPeriodEnd: parsePayrexxDate(webhook.end ?? webhook.valid_until)
  }
}
