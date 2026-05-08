<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const config = useRuntimeConfig()

const systemInfos = computed(() => [{
  label: t('systemInfo.fields.version'),
  value: String(config.public.appVersion)
}, {
  label: t('systemInfo.fields.channel'),
  value: String(config.public.appChannel)
}, {
  label: t('systemInfo.fields.commit'),
  value: String(config.public.appCommit)
}, {
  label: t('systemInfo.fields.imageTag'),
  value: String(config.public.appImageTag)
}, {
  label: t('systemInfo.fields.deployedAt'),
  value: String(config.public.appDeployedAt)
}])
</script>

<template>
  <UContainer class="py-10">
    <div class="mx-auto max-w-3xl space-y-6">
      <div class="space-y-2">
        <h1 class="text-2xl font-bold tracking-tight">
          {{ $t('systemInfo.title') }}
        </h1>
        <p class="text-muted text-sm">
          {{ $t('systemInfo.description') }}
        </p>
      </div>

      <UCard>
        <template #header>
          <h2 class="font-semibold">
            {{ $t('systemInfo.currentRelease') }}
          </h2>
        </template>

        <dl class="space-y-3">
          <div
            v-for="item in systemInfos"
            :key="item.label"
            class="grid gap-1 sm:grid-cols-[200px_1fr]"
          >
            <dt class="text-muted text-sm">
              {{ item.label }}
            </dt>
            <dd class="font-mono text-sm break-all">
              {{ item.value }}
            </dd>
          </div>
        </dl>
      </UCard>
    </div>
  </UContainer>
</template>
