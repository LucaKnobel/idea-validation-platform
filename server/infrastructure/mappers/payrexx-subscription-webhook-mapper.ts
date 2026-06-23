import type { SubscriptionStatus } from '@application/models/subscription'
import type { SubscriptionUpsertInput } from '@application/interfaces/subscription-webhook-sync-service'
import type { PayrexxSubscriptionWebhook } from '@infrastructure/validation/payrexx-subscription-webhook'

/**
 * Maps Payrexx status strings to internal enum. Isolates domain logic from provider changes.
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
 * Parses Payrexx dates to Date or null. Invalid dates → null (avoid state corruption).
 */
const parsePayrexxDate = (value: string | null): Date | null => {
  if (!value) {
    return null
  }

  const parsed = new Date(value)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Maps validated Payrexx data into the local subscription update shape.
 * userId is resolved separately so webhook data never decides account ownership.
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
