<script setup lang="ts">
defineProps<{
  progress: number;
  loading?: boolean;
  disabled?: boolean;
}>();
</script>

<template>
  <button
    class="btn btn-progress"
    :class="{ 'is-loading': loading }"
    :disabled="disabled || loading"
  >
    <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
    <span class="btn-content">
      <slot />
    </span>
  </button>
</template>

<style lang="scss" scoped>
.btn-progress {
  position: relative;
  overflow: hidden;
  // Use btn-primary styles as base but modify for progress
  color: $white;
  background-color: $dark-green; // Base background
  border-color: $marigold;
  z-index: 1;

  .btn-content {
    margin-left: auto;
    margin-right: auto;
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 0%;
    background-color: rgba($white, 0.2); // Lighten effect for progress
    // Alternatively use a different color like $marigold or $primary
    transition: width 0.3s ease-out;
    z-index: -1;
  }

  &.is-loading {
    // Override disabled opacity from global .btn
    opacity: 1 !important;
    cursor: wait;

    // Maybe change border color to show active state
    border-color: $light-marigold;
  }
}
</style>
