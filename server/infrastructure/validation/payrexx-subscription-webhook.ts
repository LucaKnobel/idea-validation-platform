import { z } from 'zod'

/**
 * Valid Payrexx subscription statuses. Exported as array for Zod enum + TS discriminated unions.
 */
export const PAYREXX_SUBSCRIPTION_WEBHOOK_STATUSES = [
  'active',
  'overdue',
  'failed',
  'cancelled',
  'in_notice'
] as const

/**
 * Validates only the subscription fields the backend actually uses.
 * Extra Payrexx fields are accepted and ignored.
 */
const PayrexxSubscriptionStatusSchema = z.enum(PAYREXX_SUBSCRIPTION_WEBHOOK_STATUSES)
const PayrexxIdentifierSchema = z.string().trim().min(1)

/**
 * Minimal invoice fields used by webhook processing.
 * referenceId links the provider event to our local checkout record.
 */
const PayrexxSubscriptionInvoiceSchema = z.object({
  referenceId: z.string().trim().min(1)
})

/**
 * Minimal contact fields used by webhook processing.
 * uuid is persisted as providerCustomerId.
 */
const PayrexxSubscriptionContactSchema = z.object({
  uuid: PayrexxIdentifierSchema
})

/**
 * Canonical subscription payload after envelope unwrapping.
 * Only fields required by mapper/service are validated.
 */
const PayrexxSubscriptionPayloadSchema = z.object({
  id: z.number().int().positive(),
  status: PayrexxSubscriptionStatusSchema,
  end: z.string().trim().min(1).nullable(),
  valid_until: z.string().trim().min(1).nullable(),
  invoice: PayrexxSubscriptionInvoiceSchema,
  contact: PayrexxSubscriptionContactSchema
})

type PayrexxEnvelope
  = | { subscription: unknown }
    | { transaction: { subscription: unknown } }
    | unknown

/**
 * Supports multiple Payrexx webhook envelope shapes and returns raw subscription payload.
 */
const unwrapSubscriptionPayload = (value: PayrexxEnvelope): unknown => {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  if ('subscription' in value) {
    return value.subscription
  }

  if ('transaction' in value && typeof value.transaction === 'object' && value.transaction !== null && 'subscription' in value.transaction) {
    return value.transaction.subscription
  }

  return value
}

/**
 * Public schema used by webhook reader.
 * 1) unwraps envelope 2) validates the normalized subscription payload.
 */
export const PayrexxSubscriptionWebhookSchema = z.preprocess(
  unwrapSubscriptionPayload,
  PayrexxSubscriptionPayloadSchema
)

export type PayrexxSubscriptionWebhook = z.infer<typeof PayrexxSubscriptionWebhookSchema>
