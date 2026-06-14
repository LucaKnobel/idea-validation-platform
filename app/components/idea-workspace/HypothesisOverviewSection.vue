<script setup lang="ts">
import type { HypothesisResponseDto } from '#shared/types/hypothesis'

/**
 * Props for rendering the overview section of one hypothesis.
 */
interface HypothesisOverviewSectionProps {
  hypothesis: HypothesisResponseDto | null
  isLoading: boolean
  statusLabel: string
}

const props = defineProps<HypothesisOverviewSectionProps>()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="text-base font-semibold text-highlighted">
        {{ $t('ideaWorkspace.hypotheses.detail.overview.title') }}
      </h2>
    </template>

    <dl class="space-y-2.5 text-sm">
      <div class="grid grid-cols-1 gap-2 md:flex md:flex-wrap md:items-start md:gap-3">
        <div class="grid gap-1">
          <dt class="font-medium text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.status') }}
          </dt>
          <dd>
            <UBadge
              :label="props.statusLabel"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </dd>
        </div>

        <div class="grid gap-1">
          <dt class="font-medium text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.dimension') }}
          </dt>
          <dd>
            <UBadge
              :label="props.hypothesis ? $t(`ideaWorkspace.hypotheses.dimensions.${props.hypothesis.dimension}`) : '-'"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </dd>
        </div>

        <div class="grid gap-1">
          <dt class="font-medium text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.priority') }}
          </dt>
          <dd>
            <UBadge
              :label="props.hypothesis ? $t(`ideaWorkspace.hypotheses.priorities.${props.hypothesis.priority}`) : '-'"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </dd>
        </div>

        <div class="grid gap-1">
          <dt class="font-medium text-muted">
            {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.evidenceType') }}
          </dt>
          <dd>
            <UBadge
              :label="props.hypothesis ? $t(`ideaWorkspace.hypotheses.evidenceTypes.${props.hypothesis.evidenceType}`) : '-'"
              color="neutral"
              variant="subtle"
              size="sm"
            />
          </dd>
        </div>
      </div>

      <div class="grid gap-1.5">
        <dt class="font-medium text-muted">
          {{ $t('ideaWorkspace.hypotheses.detail.overview.fields.canvasAssignments') }}
        </dt>

        <dd class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="section in props.hypothesis?.canvasSections || []"
            :key="section"
            :label="$t(`ideaWorkspace.canvasPage.sections.${section}`)"
            color="neutral"
            variant="subtle"
            size="sm"
          />

          <p
            v-if="(props.hypothesis?.canvasSections.length || 0) === 0"
            class="text-sm text-muted"
          >
            {{ $t('ideaWorkspace.hypotheses.detail.overview.canvasEmpty') }}
          </p>
        </dd>
      </div>
    </dl>
  </UCard>
</template>
