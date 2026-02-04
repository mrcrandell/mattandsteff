<script setup lang="ts">
import IconClose from "./icons/IconClose.vue";
import CircleProgress from "./CircleProgress.vue";

defineProps<{
  preview: string;
  alt?: string;
  progress: number;
  showRemove?: boolean;
}>();

defineEmits<{
  (e: "remove"): void;
}>();
</script>

<template>
  <div class="base-thumbnail-upload">
    <img :src="preview" :alt="alt" class="thumbnail-image" />

    <div v-if="progress > 0" class="progress-container">
      <CircleProgress :progress="progress" :size="24" :stroke-width="4" />
    </div>

    <button v-if="showRemove" class="remove-btn" @click.stop="$emit('remove')">
      <IconClose />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.base-thumbnail-upload {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: $gray-300;

  .thumbnail-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba($black, 0.6);
    color: $white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;
    z-index: 2;

    &:hover {
      background: rgba($black, 0.8);
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .progress-container {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
    background: rgba($white, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}
</style>
