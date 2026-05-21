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
import IconCircleLoading from "./icons/IconCircleLoading.vue";

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
const videoRefsById = ref<Record<string, HTMLVideoElement | null>>({});
const videoPreviewReady = ref<boolean[]>([]);
const imageLoaded = ref<boolean[]>([]);
const imageThumbLoaded = ref<boolean[]>([]);
const videoThumbLoaded = ref<boolean[]>([]);
const isSwiperReady = ref(false);
let closeTimeoutId: ReturnType<typeof setTimeout> | null = null;
let didUnmount = false;

const config = useRuntimeConfig();
const isGalleryHidden = ref(false);

function closeAfterError(error: unknown, context: string) {
  console.error(`GalleryCarousel error in ${context}`, error);
  if (!didUnmount) {
    closeGallery();
  }
}

function clampIndex(index: number) {
  if (props.imgs.length === 0) {
    return 0;
  }

  return Math.min(Math.max(index, 0), props.imgs.length - 1);
}

function getPhotoAt(index: number) {
  return props.imgs[index];
}

function getVideoRefByIndex(index: number) {
  const photoId = getPhotoAt(index)?.id;
  if (!photoId) {
    return null;
  }

  return videoRefsById.value[photoId] ?? null;
}

function setVideoRef(
  photoId: string,
  element: Element | ComponentPublicInstance | null,
) {
  videoRefsById.value[photoId] = element as HTMLVideoElement | null;
}

function loadActiveVideo(index: number) {
  const nextIndex = clampIndex(index);
  if (getPhotoAt(nextIndex)?.mediaType !== "VIDEO") {
    return;
  }

  const video = getVideoRefByIndex(nextIndex);

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

function handleVideoCanPlayThrough(index: number) {
  if (isVideoPreviewReady(index)) {
    return;
  }

  // Ensure one paint occurs with opacity 0 before revealing so CSS transition runs.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setVideoPreviewReady(index, true);
    });
  });
}

function setImageLoaded(index: number, isLoaded: boolean) {
  imageLoaded.value[index] = isLoaded;
}

function isImageLoaded(index: number) {
  return Boolean(imageLoaded.value[index]);
}

function setImageThumbLoaded(index: number, isLoaded: boolean) {
  imageThumbLoaded.value[index] = isLoaded;
}

function isImageThumbLoaded(index: number) {
  return Boolean(imageThumbLoaded.value[index]);
}

function setVideoThumbLoaded(index: number, isLoaded: boolean) {
  videoThumbLoaded.value[index] = isLoaded;
}

function isVideoThumbLoaded(index: number) {
  return Boolean(videoThumbLoaded.value[index]);
}

function shouldRenderVideo(index: number) {
  return index === activeIndex.value;
}

function getVideoSource(img: Photo, index: number) {
  if (!shouldRenderVideo(index)) {
    return undefined;
  }

  return `${config.public.assetUrl}${img.urls.original}`;
}

function getLargeImageSource(img: Photo, index: number) {
  const useLarge = index === activeIndex.value;
  const path = useLarge ? img.urls.large : img.urls.thumbnail;
  return `${config.public.assetUrl}${path}`;
}

function cueVideoPreview(index: number) {
  const nextIndex = clampIndex(index);
  if (getPhotoAt(nextIndex)?.mediaType !== "VIDEO") {
    return;
  }

  const video = getVideoRefByIndex(nextIndex);

  if (!video) {
    return;
  }

  setVideoPreviewReady(nextIndex, false);

  const setPreviewFrame = () => {
    video.pause();

    if (video.currentTime > 0) return;

    const previewTime = Number.isFinite(video.duration)
      ? Math.min(0.1, video.duration || 0.1)
      : 0.1;
    video.currentTime = previewTime;
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    setPreviewFrame();
    return;
  }

  video.addEventListener("loadeddata", setPreviewFrame, { once: true });
}

function syncActiveVideo(index: number) {
  try {
    for (const video of Object.values(videoRefsById.value)) {
      video?.pause();
    }

    const nextIndex = clampIndex(index);
    if (getPhotoAt(nextIndex)?.mediaType === "VIDEO") {
      loadActiveVideo(nextIndex);
      cueVideoPreview(nextIndex);
    }
  } catch (error) {
    closeAfterError(error, "syncActiveVideo");
  }
}

watch(
  () => props.imgs,
  (imgs) => {
    const validIds = new Set(imgs.map((img) => img.id));
    const nextRefs: Record<string, HTMLVideoElement | null> = {};
    for (const [photoId, videoRef] of Object.entries(videoRefsById.value)) {
      if (validIds.has(photoId)) {
        nextRefs[photoId] = videoRef;
      }
    }
    videoRefsById.value = nextRefs;

    imageLoaded.value = imgs.map(() => false);
    imageThumbLoaded.value = imgs.map(() => false);
    videoThumbLoaded.value = imgs.map(() => false);
    videoPreviewReady.value = imgs.map(() => false);

    if (imgs.length === 0) {
      activeIndex.value = 0;
      return;
    }

    const clampedIndex = clampIndex(activeIndex.value);
    activeIndex.value = clampedIndex;

    nextTick(() => {
      if (didUnmount) {
        return;
      }

      if (isSwiperReady.value && swiperInstance.value) {
        swiperInstance.value.update();
        if (swiperInstance.value.realIndex !== clampedIndex) {
          swiperInstance.value.slideTo(clampedIndex, 0);
        }
      }

      syncActiveVideo(clampedIndex);
    });
  },
  { immediate: true },
);

function closeGallery() {
  isGalleryHidden.value = true;
  if (closeTimeoutId) {
    clearTimeout(closeTimeoutId);
  }

  closeTimeoutId = setTimeout(() => {
    if (didUnmount) {
      return;
    }

    emit("close");
  }, 300); // Delay to allow any closing animations to complete
}

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      if (didUnmount || !swiperContainer.value || swiperInstance.value) {
        return;
      }

      try {
        const startIndex = clampIndex(props.startIndex);
        activeIndex.value = startIndex;
        swiperInstance.value = new SwiperClass(swiperContainer.value, {
          modules: [Navigation, Keyboard],
          initialSlide: startIndex,
          slidesPerView: 1,
          spaceBetween: 20,
          loop: false,
          keyboard: {
            enabled: true,
          },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
          on: {
            slideChange: (swiper) => {
              try {
                activeIndex.value = swiper.realIndex;
                emit("slide-change", swiper.realIndex);
                syncActiveVideo(swiper.realIndex);
              } catch (error) {
                closeAfterError(error, "slideChange");
              }
            },
          },
        });

        isSwiperReady.value = true;
        nextTick(() => {
          if (!didUnmount) {
            syncActiveVideo(activeIndex.value);
          }
        });
      } catch (error) {
        closeAfterError(error, "onMounted");
      }
    });
  });
});

// Watch for startIndex changes
watch(
  () => props.startIndex,
  (newIndex) => {
    if (props.imgs.length === 0) {
      activeIndex.value = 0;
      return;
    }

    const clampedIndex = clampIndex(newIndex);
    activeIndex.value = clampedIndex;

    if (
      isSwiperReady.value &&
      swiperInstance.value &&
      clampedIndex !== swiperInstance.value.realIndex
    ) {
      swiperInstance.value.slideTo(clampedIndex, 0);
    }

    nextTick(() => {
      if (!didUnmount) {
        syncActiveVideo(clampedIndex);
      }
    });
  },
);

onUnmounted(() => {
  didUnmount = true;

  if (closeTimeoutId) {
    clearTimeout(closeTimeoutId);
    closeTimeoutId = null;
  }

  for (const video of Object.values(videoRefsById.value)) {
    video?.pause();
  }

  if (swiperInstance.value) {
    swiperInstance.value.destroy();
    swiperInstance.value = null;
  }

  isSwiperReady.value = false;
});
</script>

<template>
  <div
    ref="swiperContainer"
    class="swiper-container"
    :class="{ 'is-hidden': isGalleryHidden }"
  >
    <button
      class="close-btn"
      aria-label="Close gallery"
      @click.prevent="closeGallery"
    >
      <IconClose />
    </button>
    <div class="swiper-wrapper">
      <div v-for="(img, index) in imgs" :key="img.id" class="swiper-slide">
        <div class="slide-content">
          <video
            v-if="img.mediaType === 'VIDEO' && shouldRenderVideo(index)"
            :ref="(element) => setVideoRef(img.id, element)"
            :src="getVideoSource(img, index)"
            :poster="`${config.public.assetUrl}${img.urls.thumbnail}`"
            controls
            playsinline
            :preload="activeIndex === index ? 'auto' : 'metadata'"
            class="slide-video"
            :class="{ 'is-visible': isVideoPreviewReady(index) }"
            @canplaythrough="handleVideoCanPlayThrough(index)"
          />
          <Transition name="fade-media" appear>
            <img
              v-if="img.mediaType === 'VIDEO'"
              v-show="!isVideoPreviewReady(index)"
              :src="`${config.public.assetUrl}${img.urls.thumbnail}`"
              :alt="img.post?.text || 'Video thumbnail'"
              class="slide-image video-placeholder"
              :class="{ 'is-visible': isVideoThumbLoaded(index) }"
              loading="lazy"
              @load="setVideoThumbLoaded(index, true)"
            />
          </Transition>
          <Transition name="fade-media" appear>
            <div
              v-if="img.mediaType === 'VIDEO'"
              v-show="!isVideoPreviewReady(index)"
              class="video-loading-overlay"
              aria-hidden="true"
            >
              <IconCircleLoading class="icon-loading" />
            </div>
          </Transition>
          <Transition name="fade-media" appear>
            <img
              v-if="img.mediaType !== 'VIDEO'"
              v-show="!isImageLoaded(index)"
              :src="`${config.public.assetUrl}${img.urls.thumbnail}`"
              :alt="img.post?.text || 'Gallery image preview'"
              class="slide-image image-placeholder"
              :class="{ 'is-visible': isImageThumbLoaded(index) }"
              loading="lazy"
              @load="setImageThumbLoaded(index, true)"
            />
          </Transition>
          <Transition name="fade-media" appear>
            <div
              v-if="img.mediaType !== 'VIDEO'"
              v-show="!isImageLoaded(index)"
              class="image-loading-overlay"
              aria-hidden="true"
            >
              <IconCircleLoading class="icon-loading" />
            </div>
          </Transition>
          <Transition name="fade-media" appear>
            <img
              v-if="img.mediaType !== 'VIDEO'"
              :src="getLargeImageSource(img, index)"
              :alt="img.post?.text || 'Gallery image'"
              class="slide-image"
              :class="{ 'is-visible': isImageLoaded(index) }"
              :loading="activeIndex === index ? 'eager' : 'lazy'"
              :fetchpriority="activeIndex === index ? 'high' : 'auto'"
              @load="setImageLoaded(index, true)"
            />
          </Transition>
          <div
            v-if="img.post?.text || img.user?.name || img.post?.user?.name"
            class="info-overlay"
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
    <div class="swiper-button-prev" />
    <div class="swiper-button-next" />
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

.slide-image {
  opacity: 0;
  transition: opacity 0.35s ease;
}

.slide-image.is-visible {
  opacity: 1;
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
  filter: blur(rem(2));
}

.image-placeholder {
  position: absolute;
  inset: 0;
  margin: auto;
  filter: blur(rem(8));
}

.video-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.image-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.icon-loading {
  width: 5rem;
  height: 5rem;
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
