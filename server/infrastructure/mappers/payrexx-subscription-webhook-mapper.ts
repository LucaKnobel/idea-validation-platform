import type { SubscriptionStatus } from '@application/models/subscription'
import type { SubscriptionUpsertInput } from '@application/interfaces/subscription-webhook-sync-service'
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
 * Converts the validated Payrexx webhook payload into the upsert input model.
 * userId must be resolved server-side from checkout before calling this.
 */
export const mapPayrexxWebhookToUpsertInput = (
  webhook: PayrexxSubscriptionWebhook,
  userId: string
): SubscriptionUpsertInput => {
  return {
    userId,
    status: mapPayrexxStatus(webhook.status),
    providerCustomerId: webhook.contact.uuid,
    providerSubscriptionId: String(webhook.id),
    currentPeriodEnd: parsePayrexxDate(webhook.end ?? webhook.valid_until)
  }
}
