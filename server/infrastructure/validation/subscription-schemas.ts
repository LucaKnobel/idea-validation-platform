import * as z from 'zod'
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUSES } from '@application/models/subscription'

export const CancelSubscriptionResponseSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodEnd: z.iso.datetime().nullable()
})

export type CancelSubscriptionResponseDto = z.infer<typeof CancelSubscriptionResponseSchema>

export const SubscriptionStatusResponseSchema = z.object({
  plan: z.enum(SUBSCRIPTION_PLANS).nullable(),
  status: z.enum(SUBSCRIPTION_STATUSES).nullable(),
  currentPeriodEnd: z.iso.datetime().nullable(),
  isPro: z.boolean()
})

export type SubscriptionStatusResponseDto = z.infer<typeof SubscriptionStatusResponseSchema>
