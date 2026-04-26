<script setup lang="ts">
withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const sizeClasses = {
  sm: {
    container: 'gap-0.5',
    text: 'text-lg',
    icon: 'w-4 h-4',
    dot: 'w-1 h-1',
    border: 'border-[1px]'
  },
  md: {
    container: 'gap-0.75',
    text: 'text-xl',
    icon: 'w-5 h-5',
    dot: 'w-1.5 h-1.5',
    border: 'border-[1.25px]'
  },
  lg: {
    container: 'gap-1',
    text: 'text-3xl',
    icon: 'w-8 h-8',
    dot: 'w-2.5 h-2.5',
    border: 'border-[1.5px]'
  }
}
</script>

<template>
  <NuxtLinkLocale
    to="/"
    :class="[
      'inline-flex items-center font-semibold tracking-tight transition-opacity hover:opacity-80',
      sizeClasses[size].container
    ]"
  >
    <!-- Icon -->
    <span
      :class="[
        'relative flex items-center justify-center',
        sizeClasses[size].icon
      ]"
    >
      <!-- core node -->
      <span
        :class="[
          'bg-primary rounded-sm',
          sizeClasses[size].dot
        ]"
      />

      <!-- structure frame -->
      <span
        :class="[
          'absolute inset-0 rounded-md',
          sizeClasses[size].border,
          'border-primary/40 dark:border-primary/60'
        ]"
      />
    </span>

    <!-- Wordmark -->
    <span
      :class="[
        'text-foreground',
        sizeClasses[size].text
      ]"
    >
      Evidara
    </span>
  </NuxtLinkLocale>
</template>
