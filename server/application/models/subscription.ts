export type SubscriptionPlan = 'FREE' | 'PRO'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED'

export type Subscription = {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  providerReference: string | null
  currentPeriodEnd: Date | null
}
