<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import type { Swiper } from "swiper";
import { Swiper as SwiperClass } from "swiper";
import { Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/keyboard";

import type { Photo } from "~~/shared/types/photo";
import IconClose from "./icons/IconClose.vue";
import { set } from "zod";

const props = defineProps<{
  imgs: Photo[];
  startIndex: number;
}>();

const emit = defineEmits<{
  (e: "slide-change", index: number): void;
  (e: "close"): void;
}>();

const swiperContainer = ref<HTMLElement | null>(null);
const swiperInstance = ref<Swiper | null>(null);

const config = useRuntimeConfig();
const isGalleryHidden = ref(false);

function closeGallery() {
  isGalleryHidden.value = true;
  setTimeout(() => {
    emit("close");
  }, 300); // Delay to allow any closing animations to complete
}

onMounted(() => {
  // Swiper initialization
  setTimeout(() => {
    if (swiperContainer.value) {
      console.log("Initializing Swiper");
      swiperInstance.value = new SwiperClass(swiperContainer.value, {
        modules: [Navigation, Keyboard],
        initialSlide: props.startIndex,
        slidesPerView: 1,
        spaceBetween: 20,
        loop: true,
        keyboard: {
          enabled: true,
        },
        navigation: {
          nextEl: ".swiper-button-next",
          prevEl: ".swiper-button-prev",
        },
        on: {
          slideChange: (swiper) => {
            emit("slide-change", swiper.realIndex);
          },
        },
      });
    }
  }, 50);
});

// Watch for startIndex changes
watch(
  () => props.startIndex,
  (newIndex) => {
    if (swiperInstance.value && newIndex !== swiperInstance.value.realIndex) {
      swiperInstance.value.slideToLoop(newIndex, 0);
    }
  },
);

onUnmounted(() => {
  if (swiperInstance.value) {
    swiperInstance.value.destroy();
    swiperInstance.value = null;
  }
});
</script>

<template>
  <div
    class="swiper-container"
    ref="swiperContainer"
    :class="{ 'is-hidden': isGalleryHidden }"
  >
    <button class="close-btn" @click="closeGallery" aria-label="Close gallery">
      <IconClose />
    </button>
    <div class="swiper-wrapper">
      <div class="swiper-slide" v-for="img in imgs" :key="img.id">
        <div class="slide-content">
          <img
            :src="`${config.public.assetUrl}${img.urls.large}`"
            :alt="img.post?.text || 'Gallery image'"
            class="slide-image"
            loading="lazy"
          />
          <div
            class="info-overlay"
            v-if="img.post?.text || img.user?.name || img.post?.user?.name"
          >
            <div class="info-content">
              <p v-if="img.post?.text" class="post-text">{{ img.post.text }}</p>
              <p
                v-if="img.user?.name || img.post?.user?.name"
                class="post-author"
              >
                — {{ img.user?.name || img.post?.user?.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Swiper Navigation Buttons -->
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
  </div>
</template>

<style lang="scss" scoped>
.swiper-container {
  overflow: hidden;
  width: 100%;
  height: 100vh;
  position: relative;
  background-color: transparent;
  transition: opacity 0.3s ease;
  &.is-hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.swiper-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
}

.swiper-slide {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.close-btn {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 100;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
  color: white;
  padding: 0.75rem;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }

  :deep(svg) {
    width: 100%;
    height: 100%;
    fill: currentColor;
  }
}

.slide-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.slide-image {
  max-width: 100%;
  max-height: 100vh;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
  color: white;
  padding: 4rem 2rem 2rem;
  pointer-events: none; // Let clicks pass through if needed
  text-align: center;
}

.info-content {
  max-width: 600px;
  margin: 0 auto;
}

.post-text {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.post-author {
  font-size: 0.9rem;
  opacity: 0.8;
  font-style: italic;
}

// Swiper Navigation Styling
.swiper-button-next,
.swiper-button-prev {
  color: white;
  &::after {
    font-size: 2rem;
  }
}
</style>
