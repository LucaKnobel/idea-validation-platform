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
 * Validates Payrexx webhook payloads and unwraps the supported envelope variants.
 * This keeps downstream code working with one stable subscription shape.
 */
const PayrexxSubscriptionStatusSchema = z.enum(PAYREXX_SUBSCRIPTION_WEBHOOK_STATUSES)
const PayrexxIdentifierSchema = z.string().trim().min(1)

const PayrexxSubscriptionInvoiceSchema = z.object({
  referenceId: z.string().trim().min(1)
})

const PayrexxSubscriptionContactSchema = z.object({
  id: z.number().int().positive(),
  uuid: PayrexxIdentifierSchema,
  email: z.union([z.email(), z.literal('')]).optional()
})

const PayrexxSubscriptionPayloadSchema = z.object({
  id: z.number().int().positive(),
  uuid: PayrexxIdentifierSchema,
  status: PayrexxSubscriptionStatusSchema,
  start: z.string().trim().min(1),
  end: z.string().trim().min(1).nullable(),
  valid_until: z.string().trim().min(1).nullable(),
  paymentInterval: z.string().trim().min(1),
  invoice: PayrexxSubscriptionInvoiceSchema,
  contact: PayrexxSubscriptionContactSchema
})

export const PayrexxSubscriptionWebhookSchema = z
  .union([
    PayrexxSubscriptionPayloadSchema,
    z.object({
      subscription: PayrexxSubscriptionPayloadSchema
    }),
    z.object({
      transaction: z.object({
        subscription: PayrexxSubscriptionPayloadSchema
      })
    })
  ])
  .transform((value) => {
    if ('subscription' in value) {
      return value.subscription
    }

    if ('transaction' in value) {
      return value.transaction.subscription
    }

    return value
  })

export type PayrexxSubscriptionWebhook = z.infer<typeof PayrexxSubscriptionWebhookSchema>
