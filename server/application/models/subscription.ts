export type SubscriptionPlan = 'FREE' | 'PRO'
export type SubscriptionStatus
  = | 'ACTIVE'
    | 'IN_NOTICE'
    | 'OVERDUE'
    | 'FAILED'
    | 'CANCELLED'

export type Subscription = {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: Date | null
}
