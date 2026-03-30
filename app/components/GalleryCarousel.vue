<script setup lang="ts">
import {
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";
import type { Swiper } from "swiper";
import { Swiper as SwiperClass } from "swiper";
import { Navigation, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/keyboard";

import type { Photo } from "~~/shared/types/photo";
import IconClose from "./icons/IconClose.vue";

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
const activeIndex = ref(props.startIndex);
const videoRefs = ref<(HTMLVideoElement | null)[]>([]);
const videoPreviewReady = ref<boolean[]>([]);
const imageLoaded = ref<boolean[]>([]);
const videoThumbLoaded = ref<boolean[]>([]);

const config = useRuntimeConfig();
const isGalleryHidden = ref(false);

function setVideoRef(
  index: number,
  element: Element | ComponentPublicInstance | null,
) {
  videoRefs.value[index] = element as HTMLVideoElement | null;
}

function loadActiveVideo(index: number) {
  if (props.imgs[index]?.mediaType !== "VIDEO") {
    return;
  }

  const video = videoRefs.value[index];

  if (!video) {
    return;
  }

  video.preload = "auto";
  video.load();
}

function setVideoPreviewReady(index: number, isReady: boolean) {
  videoPreviewReady.value[index] = isReady;
}

function isVideoPreviewReady(index: number) {
  return Boolean(videoPreviewReady.value[index]);
}

function setImageLoaded(index: number, isLoaded: boolean) {
  imageLoaded.value[index] = isLoaded;
}

function isImageLoaded(index: number) {
  return Boolean(imageLoaded.value[index]);
}

function setVideoThumbLoaded(index: number, isLoaded: boolean) {
  videoThumbLoaded.value[index] = isLoaded;
}

function isVideoThumbLoaded(index: number) {
  return Boolean(videoThumbLoaded.value[index]);
}

function cueVideoPreview(index: number) {
  if (props.imgs[index]?.mediaType !== "VIDEO") {
    return;
  }

  const video = videoRefs.value[index];

  if (!video) {
    return;
  }

  setVideoPreviewReady(index, false);

  const setPreviewFrame = () => {
    video.pause();

    if (video.currentTime > 0) {
      setVideoPreviewReady(index, true);
      return;
    }

    const previewTime = Number.isFinite(video.duration)
      ? Math.min(0.1, video.duration || 0.1)
      : 0.1;

    const handleSeeked = () => {
      setVideoPreviewReady(index, true);
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.currentTime = previewTime;
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    setPreviewFrame();
    return;
  }

  video.addEventListener("loadeddata", setPreviewFrame, { once: true });
}

function syncActiveVideo(index: number) {
  for (const [videoIndex, video] of videoRefs.value.entries()) {
    if (!video) {
      continue;
    }

    if (videoIndex === index && props.imgs[videoIndex]?.mediaType === "VIDEO") {
      loadActiveVideo(videoIndex);
      cueVideoPreview(videoIndex);
      continue;
    }

    video.pause();
  }
}

watch(
  () => props.imgs,
  (imgs) => {
    imageLoaded.value = imgs.map(() => false);
    videoThumbLoaded.value = imgs.map(() => false);
    videoPreviewReady.value = imgs.map(() => false);
  },
  { immediate: true },
);

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
            activeIndex.value = swiper.realIndex;
            emit("slide-change", swiper.realIndex);
            syncActiveVideo(swiper.realIndex);
          },
        },
      });

      nextTick(() => {
        syncActiveVideo(activeIndex.value);
      });
    }
  }, 50);
});

// Watch for startIndex changes
watch(
  () => props.startIndex,
  (newIndex) => {
    activeIndex.value = newIndex;

    if (swiperInstance.value && newIndex !== swiperInstance.value.realIndex) {
      swiperInstance.value.slideToLoop(newIndex, 0);
    }

    nextTick(() => {
      syncActiveVideo(newIndex);
    });
  },
);

onUnmounted(() => {
  for (const video of videoRefs.value) {
    video?.pause();
  }

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
      <div class="swiper-slide" v-for="(img, index) in imgs" :key="img.id">
        <div class="slide-content">
          <video
            v-if="img.mediaType === 'VIDEO'"
            :ref="(element) => setVideoRef(index, element)"
            :src="`${config.public.assetUrl}${img.urls.original}`"
            :poster="`${config.public.assetUrl}${img.urls.thumbnail}`"
            controls
            playsinline
            :preload="activeIndex === index ? 'auto' : 'metadata'"
            class="slide-video"
            :class="{ 'is-visible': isVideoPreviewReady(index) }"
          ></video>
          <Transition name="fade-media" appear>
            <img
              v-if="img.mediaType === 'VIDEO'"
              v-show="!isVideoPreviewReady(index) && isVideoThumbLoaded(index)"
              :src="`${config.public.assetUrl}${img.urls.thumbnail}`"
              :alt="img.post?.text || 'Video thumbnail'"
              class="slide-image video-placeholder"
              loading="lazy"
              @load="setVideoThumbLoaded(index, true)"
            />
          </Transition>
          <Transition name="fade-media" appear>
            <img
              v-if="img.mediaType !== 'VIDEO'"
              v-show="isImageLoaded(index)"
              :src="`${config.public.assetUrl}${img.urls.large}`"
              :alt="img.post?.text || 'Gallery image'"
              class="slide-image"
              loading="lazy"
              @load="setImageLoaded(index, true)"
            />
          </Transition>
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

.slide-image,
.slide-video {
  max-width: 100%;
  max-height: 90vh; /* Leave space for controls */
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.slide-video {
  opacity: 0;
  transition: opacity 0.35s ease;
}

.slide-video.is-visible {
  opacity: 1;
}

.video-placeholder {
  position: absolute;
  inset: 0;
  margin: auto;
}

.fade-media-enter-active,
.fade-media-leave-active {
  transition: opacity 0.35s ease;
}

.fade-media-enter-from,
.fade-media-leave-to {
  opacity: 0;
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
