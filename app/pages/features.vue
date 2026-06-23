<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t } = useI18n()

const featureItems = computed(() => [
  {
    icon: 'i-lucide-layout-dashboard',
    title: t('featuresPage.items.canvas.title'),
    description: t('featuresPage.items.canvas.description')
  },
  {
    icon: 'i-lucide-flask-conical',
    title: t('featuresPage.items.hypotheses.title'),
    description: t('featuresPage.items.hypotheses.description')
  },
  {
    icon: 'i-lucide-ruler',
    title: t('featuresPage.items.metrics.title'),
    description: t('featuresPage.items.metrics.description')
  },
  {
    icon: 'i-lucide-activity',
    title: t('featuresPage.items.experimentsMeasurements.title'),
    description: t('featuresPage.items.experimentsMeasurements.description')
  },
  {
    icon: 'i-lucide-chart-column',
    title: t('featuresPage.items.validationDashboard.title'),
    description: t('featuresPage.items.validationDashboard.description')
  },
  {
    icon: 'i-lucide-git-branch',
    title: t('featuresPage.items.ideaVersioning.title'),
    description: t('featuresPage.items.ideaVersioning.description')
  }
])

const leanItems = computed(() => [
  t('featuresPage.lean.items.canvas'),
  t('featuresPage.lean.items.hypothesisValidation'),
  t('featuresPage.lean.items.evidenceDecisions'),
  t('featuresPage.lean.items.versionHistory'),
  t('featuresPage.lean.items.structuredExperiments')
])
</script>

<template>
  <UContainer class="py-10">
    <div class="mx-auto max-w-5xl space-y-10">
      <UPageHeader
        :title="$t('featuresPage.title')"
        :description="$t('featuresPage.intro')"
      />

      <UCard>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <UCard
            v-for="item in featureItems"
            :key="item.title"
            class="h-full ring-1 ring-primary/12 shadow-sm shadow-primary/8"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex size-9 items-center justify-center rounded-md bg-elevated/80">
                  <UIcon
                    :name="item.icon"
                    class="size-5 text-primary"
                  />
                </div>

                <h2 class="text-base font-semibold text-highlighted">
                  {{ item.title }}
                </h2>
              </div>
            </template>

            <p class="text-sm text-toned">
              {{ item.description }}
            </p>
          </UCard>
        </div>
      </UCard>

      <UCard class="ring-1 ring-primary/10 shadow-sm shadow-primary/6">
        <template #header>
          <div class="space-y-2">
            <h2 class="text-xl font-semibold tracking-tight text-highlighted">
              {{ $t('featuresPage.lean.title') }}
            </h2>
            <p class="text-sm text-muted md:text-base">
              {{ $t('featuresPage.lean.description') }}
            </p>
          </div>
        </template>

        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="item in leanItems"
            :key="item"
            class="flex items-start gap-2 text-sm text-toned"
          >
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span>{{ item }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </UContainer>
</template>
