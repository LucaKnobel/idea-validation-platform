export const SUBSCRIPTION_PLANS = ['FREE', 'PRO'] as const
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number]
export const SUBSCRIPTION_STATUSES = [
  'ACTIVE',
  'IN_NOTICE',
  'OVERDUE',
  'FAILED',
  'CANCELLED'
] as const

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

export type Subscription = {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}
