<script setup lang="ts">
import type { Photo } from "~~/shared/types/photo";

const props = defineProps<{
  img: Photo;
}>();

const config = useRuntimeConfig();

const imgThumb = computed(() => {
  return `${config.public.assetUrl}${props.img.urls.thumbnail}`;
});

const imgLg = computed(() => {
  return `${config.public.assetUrl}${props.img.urls.large}`;
});
</script>

<template>
  <div class="base-thumbnail">
    <div v-if="props.img.mediaType === 'VIDEO'" class="video-overlay">
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
    <picture>
      <img
        :src="imgThumb"
        :alt="props.img.post?.text || 'Thumbnail image'"
        class="thumbnail-image"
        loading="lazy"
      />
    </picture>
  </div>
</template>

<style scoped>
.base-thumbnail {
  position: relative;
  width: 100%;
  aspect-ratio: 1; /* Ensure square */
  overflow: hidden;
  background-color: #f3f4f6;
  border-radius: 4px;
}

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
  width: 2rem;
  height: 2rem;
  color: white;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}
</style>
