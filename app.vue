<template>
  <div>
    <AppHeader />
    <NuxtPage />
  </div>
</template>

<style lang="scss">
@import "~/assets/scss/root.scss";
@import "~/assets/scss/reboot.scss";
@import "~/assets/scss/buttons.scss";
@import "~/assets/scss/global.scss";
// @use "~/assets/scss/_root.scss";

body #__nuxt {
  min-height: 100%;
  > .site-container, > .site-container > .layout-container {
    min-height: 100vh;
  }
}
</style>