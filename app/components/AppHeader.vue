<script setup lang="ts">
const isScrolled = ref(false);
let lastScrollTime = 300;
let scrollTimeout: NodeJS.Timeout | null = null;

const checkScroll = () => {
  isScrolled.value = window.scrollY > 20;
  lastScrollTime = Date.now();
  scrollTimeout = null;
};

const handleScroll = () => {
  const now = Date.now();

  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  if (now - lastScrollTime >= 300) {
    checkScroll();
  } else {
    scrollTimeout = setTimeout(checkScroll, 300 - (now - lastScrollTime));
  }
};

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <header class="app-header" :class="{ 'is-scrolled': isScrolled }">
    <div class="logo-container">
      <LogoIcon class="logo" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: rem(5);
  margin-bottom: rem(5);
  &::after {
    position: absolute;
    content: "";
    display: block;
    width: 100%;
    height: rem(75);
    background-color: #044044;
  }
  .logo-container {
    position: relative;
    z-index: 2;
    border: rem(2) solid #c48b2b;
    border-radius: 50%;
    background-color: #fff;
    width: rem(200);
    height: rem(200);
    padding: rem(20);
    transition:
      width 0.25s ease,
      height 0.25s ease;
  }
  .logo {
    overflow: hidden;
    display: block;
    width: 100%;
    height: 100%;
    // margin-bottom: rem(50);
  }

  &.is-scrolled {
    .logo-container {
      width: rem(150);
      height: rem(150);
    }
  }
}
</style>
