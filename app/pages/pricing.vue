<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const localePath = useLocalePath()

const freeFeatures = computed(() => [
  $t('pricingPage.plans.free.features.account'),
  $t('pricingPage.plans.free.features.ideaLimit'),
  $t('pricingPage.plans.free.features.coreValidation'),
  $t('pricingPage.plans.free.features.versionHistory')
])

const proFeatures = computed(() => [
  $t('pricingPage.plans.pro.features.account'),
  $t('pricingPage.plans.pro.features.unlimitedIdeas'),
  $t('pricingPage.plans.pro.features.coreValidation'),
  $t('pricingPage.plans.pro.features.versioning')
])
</script>

<template>
  <UContainer class="py-10">
    <div class="mx-auto max-w-5xl space-y-10">
      <UPageHeader
        :title="$t('pricingPage.title')"
        :description="$t('pricingPage.intro')"
      />

      <UPricingPlans scale>
        <UPricingPlan
          :title="$t('pricingPage.plans.free.title')"
          :description="$t('pricingPage.plans.free.description')"
          :price="$t('pricingPage.plans.free.price')"
          :features="freeFeatures"
        >
          <template #button>
            <UButton
              block
              color="neutral"
              variant="outline"
              :to="localePath('/auth/register')"
            >
              {{ $t('pricingPage.actions.createFreeAccount') }}
            </UButton>
          </template>
        </UPricingPlan>

        <UPricingPlan
          scale
          :title="$t('pricingPage.plans.pro.title')"
          :description="$t('pricingPage.plans.pro.description')"
          :price="$t('pricingPage.plans.pro.price')"
          :billing-cycle="$t('pricingPage.plans.pro.billingCycle')"
          :features="proFeatures"
          :badge="{ label: $t('pricingPage.plans.pro.badge'), color: 'primary', variant: 'subtle' }"
        >
          <template #button>
            <UButton
              block
              color="primary"
              :to="localePath('/auth/register')"
            >
              {{ $t('pricingPage.actions.createAccountAndUpgrade') }}
            </UButton>
          </template>
        </UPricingPlan>
      </UPricingPlans>
    </div>
  </UContainer>
</template>
