import { url } from '@nuxt/test-utils/e2e'
import { prisma } from '@infrastructure/db/prisma'
import type { SubscriptionPlan, SubscriptionStatus } from '@application/models/subscription'
import { createClientIp } from './auth-test-helpers'

export type SubscriptionSeedInput = {
  userId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  providerCustomerId?: string | null
  providerSubscriptionId?: string | null
  currentPeriodEnd?: Date | null
}

export const payrexxCheckoutPageUrl = process.env.NUXT_PUBLIC_PAYREXX_PRO_PAGE_URL

export const payrexxWebhookSecret = process.env.NUXT_PAYREXX_WEBHOOK_SECRET

export const createAuthenticatedApiHeaders = (cookieHeader: string): Record<string, string> => {
  const origin = new URL(url('/')).origin

  return {
    'cookie': cookieHeader,
    'content-type': 'application/json',
    origin,
    'referer': `${origin}/`,
    'x-forwarded-for': createClientIp()
  }
}

export const postWithCookie = async (
  path: string,
  cookieHeader: string,
  body: unknown = {}
): Promise<Response> => {
  return fetch(url(path), {
    method: 'POST',
    headers: createAuthenticatedApiHeaders(cookieHeader),
    body: JSON.stringify(body)
  })
}

export const getWithCookie = async (path: string, cookieHeader: string): Promise<Response> => {
  return fetch(url(path), {
    method: 'GET',
    headers: {
      'cookie': cookieHeader,
      'x-forwarded-for': createClientIp()
    }
  })
}

export const createSubscription = async (input: SubscriptionSeedInput) => {
  return prisma.subscription.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      status: input.status,
      providerCustomerId: input.providerCustomerId ?? null,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      currentPeriodEnd: input.currentPeriodEnd ?? null
    }
  })
}
