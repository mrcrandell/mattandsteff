<script setup lang="ts">
import IconClose from "./icons/IconClose.vue";
import CircleProgress from "./CircleProgress.vue";

defineProps<{
  preview: string;
  alt?: string;
  progress: number;
  showRemove?: boolean;
  isVideo?: boolean;
}>();

defineEmits<{
  (e: "remove"): void;
}>();
</script>

<template>
  <div class="base-thumbnail-upload">
    <div v-if="isVideo" class="video-overlay">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        class="play-icon"
      >
        <path
          fill-rule="evenodd"
          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
          clip-rule="evenodd"
        />
      </svg>
    </div>
    <img v-if="preview" :src="preview" :alt="alt" class="thumbnail-image" />
    <div v-else class="thumbnail-placeholder">
      <span class="placeholder-icon">🎬</span>
    </div>

    <div v-if="progress > 0" class="progress-container">
      <CircleProgress :progress="progress" :size="24" />
    </div>

    <button v-if="showRemove" class="remove-btn" @click.stop="$emit('remove')">
      <IconClose />
    </button>
  </div>
</template>

<style lang="scss" scoped>
@use "sass:color";
.base-thumbnail-upload {
  /* ... */

  .thumbnail-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-color: #e9ecef;
    font-size: 2rem;
  }

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

  .video-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.1);
    z-index: 10;
    pointer-events: none;
  }

  .play-icon {
    width: 1.5rem;
    height: 1.5rem;
    color: white;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: $danger;
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
    padding: rem(5);
    z-index: 2;
    transition:
      background-color 0.5s ease-in-out,
      border-color 0.2s,
      color 0.2s;
    &:hover {
      background: color.adjust($danger, $lightness: -10%);
    }

    svg {
      width: 100%;
      height: auto;
      fill: currentColor;
    }
  }

  .progress-container {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 1;
    // background: rgba($white, 0.8);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
