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
    <picture>
      <img
        :src="imgThumb"
        :alt="props.img.post?.text || 'Thumbnail image'"
        class="thumbnail-image"
      />
    </picture>
  </div>
</template>
