import * as z from 'zod'
import { SUBSCRIPTION_STATUSES } from '@application/models/subscription'

export const CancelSubscriptionResponseSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES),
  currentPeriodEnd: z.iso.datetime().nullable()
})

export type CancelSubscriptionResponseDto = z.infer<typeof CancelSubscriptionResponseSchema>
