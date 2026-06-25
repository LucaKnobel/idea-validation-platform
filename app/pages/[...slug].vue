<script setup lang="ts">
import { withLeadingSlash } from 'ufo'

const route = useRoute()
const { locale } = useI18n()
const localePath = useLocalePath()
const { handleRateLimitError } = useErrorHandler()

/**
 * Reconstructs the current content slug from the catch-all route parameter.
 */
const slug = computed(() => {
  const value = normalizeContentSlug(route.params.slug)

  return withLeadingSlash(String(value))
})

/**
 * Backend endpoint that resolves the localized content document for the current slug.
 */
const contentPath = computed(() => `/api/content${slug.value}`)

const { data: page } = await useAsyncData(
  () => `page-${locale.value}-${slug.value}`,
  /**
   * Loads the current content document and turns backend misses into a null state for the page UI.
   */
  async () => {
    try {
      return await $fetch(contentPath.value)
    } catch (error: unknown) {
      if (handleRateLimitError(error)) {
        return null
      }
      return null
    }
  },
  { watch: [locale, slug] }
)
</script>

<template>
  <UContainer class="py-10">
    <div
      v-if="page"
      class="prose prose-neutral max-w-none"
    >
      <ContentRenderer :value="page" />
    </div>
    <div
      v-else
      class="min-h-[50vh] flex flex-col items-center justify-center text-center"
    >
      <h1 class="text-2xl font-semibold tracking-tight">
        {{ $t('content.notFound.title') }}
      </h1>
      <p class="text-muted mt-2">
        {{ $t('content.notFound.text') }}
      </p>
      <div class="mt-6">
        <UButton
          :to="localePath('/')"
          icon="i-lucide-home"
          color="primary"
          variant="soft"
        >
          {{ $t('common.backToHome') }}
        </UButton>
      </div>
    </div>
  </UContainer>
</template>
