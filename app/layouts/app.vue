<template>
  <div class="min-h-screen bg-default">
    <UHeader>
      <template #left>
        <AppLogo size="md" />
      </template>

      <template #right>
        <AppLogoutButton />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-8">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>
