import { z } from 'zod'

export const PAYREXX_SUBSCRIPTION_WEBHOOK_STATUSES = [
  'active',
  'overdue',
  'failed',
  'cancelled',
  'in_notice'
] as const

const PayrexxSubscriptionStatusSchema = z.enum(PAYREXX_SUBSCRIPTION_WEBHOOK_STATUSES)

const PayrexxSubscriptionInvoiceSchema = z.object({
  referenceId: z.string().trim().min(1)
})

const PayrexxSubscriptionContactSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.uuid(),
  email: z.email().optional()
})

const PayrexxSubscriptionPayloadSchema = z.object({
  id: z.number().int().positive(),
  uuid: z.uuid(),
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
    })
  ])
  .transform(value => ('subscription' in value ? value.subscription : value))

export type PayrexxSubscriptionWebhook = z.infer<typeof PayrexxSubscriptionWebhookSchema>
