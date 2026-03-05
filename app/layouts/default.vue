<template>
  <div class="site-container">
    <AppHeader />
    <slot />
  </div>
</template>

<style lang="scss" scoped>
.site-container {
  display: flex;
  flex-direction: column;
}
</style>
