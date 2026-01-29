<template>
  <header class="app-header">
    <div class="logo-container">
      <LogoIcon class="logo" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 15px;
  margin-bottom: rem(50);
  // height: 64px;
  // background-color: #044044;
  &::after {
    position: absolute;
    content: "";
    display: block;
    width: 100%;
    height: 75px;
    background-color: #044044;
  }
  .logo-container {
    position: relative;
    z-index: 2;
    border: 2px solid #c48b2b;
    border-radius: 50%;
    background-color: #FFF;
    width: rem(250);
    height: rem(250);
    padding: rem(20);
  }
  .logo {
    overflow: hidden;
    display: block;
    width: 100%;
    height: 100%;
    // margin-bottom: 50px;
  }
}
</style>