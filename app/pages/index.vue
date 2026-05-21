<script setup lang="ts">
import type { Photo } from "~~/shared/types/photo";

type PhotosResponse = {
  imgs: Photo[];
  hasMore: boolean;
  cursor?: string;
};

const REFRESH_THROTTLE_MS = 30000;
const OFFLINE_NOTICE = "You're offline. Showing saved gallery.";
const ONLINE_NOTICE = "Back online. Refreshing gallery...";

const imgs = useState<Photo[]>("gallery-imgs", () => []);
const hasMore = useState<boolean>("gallery-has-more", () => true);
const cursor = useState<string | undefined>("gallery-cursor", () => undefined);
const lastSyncedAt = useState<number>("gallery-last-synced-at", () => 0);
const bottomOfPageRef = ref<HTMLElement | null>(null);
const route = useRoute();
const router = useRouter();
const { user, fetch: refreshSession } = useUserSession();
const {
  toasts,
  removeToast,
  success: showSuccess,
  warning: showWarning,
  info: showInfo,
} = useToast();
const runtimeConfig = useRuntimeConfig();
const isModalOpen = ref(false);
const isGalleryOpen = ref(false);
const activeGalleryIndex = ref(0);
const activeGalleryPhotoId = ref<string | null>(null);
const isGalleryOpening = ref(false);
const isLoading = ref(imgs.value.length === 0);
const isRefreshing = ref(false);
const isFetchingPage = ref(false);
const offlineNoticeShown = ref(false);
const onlineNoticeShown = ref(false);

const isIOSSafari = computed(() => {
  if (!import.meta.client) {
    return false;
  }

  const ua = navigator.userAgent;
  const isIOS = /iP(hone|ad|od)/.test(ua);
  const isWebKit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIOS && isWebKit;
});

const galleryWindowSize = computed(() => (isIOSSafari.value ? 8 : 24));
const galleryWindowHalf = computed(() =>
  Math.floor(galleryWindowSize.value / 2),
);
const maxInMemoryItems = computed(() => (isIOSSafari.value ? 80 : 200));

const GALLERY_CRASH_CONTEXT_KEY = "gallery-crash-context";
const CRASH_DEBUG_STORAGE_KEY = "crash-debug-enabled";
const isCrashDebugActive = ref(false);

function updateCrashDebugState() {
  if (!import.meta.client) {
    isCrashDebugActive.value = false;
    return;
  }

  const runtimeEnabled = runtimeConfig.public.enableCrashDebug === true;
  const localEnabled = localStorage.getItem(CRASH_DEBUG_STORAGE_KEY) === "1";
  isCrashDebugActive.value = runtimeEnabled || localEnabled;
}

function persistGalleryCrashContext() {
  if (!isCrashDebugActive.value) {
    return;
  }

  const context = {
    time: new Date().toISOString(),
    route: route.fullPath,
    imgsLength: imgs.value.length,
    hasMore: hasMore.value,
    cursor: cursor.value ?? null,
    activeGalleryIndex: activeGalleryIndex.value,
    activeGalleryPhotoId: activeGalleryPhotoId.value,
    isGalleryOpen: isGalleryOpen.value,
    isGalleryOpening: isGalleryOpening.value,
    isLoading: isLoading.value,
    isRefreshing: isRefreshing.value,
    isFetchingPage: isFetchingPage.value,
  };

  try {
    sessionStorage.setItem(GALLERY_CRASH_CONTEXT_KEY, JSON.stringify(context));
  } catch (error) {
    console.warn("Failed to persist gallery crash context", error);
  }
}

async function handleUploadSuccess() {
  isLoading.value = true;
  await refreshFromStart();
  await new Promise((resolve) => setTimeout(resolve, 500));
  isModalOpen.value = false;
  showSuccess("Upload successful!");
}

function openGallery(photoId: string) {
  if (isGalleryOpening.value) {
    return;
  }

  isGalleryOpening.value = true;
  const nextIndex = imgs.value.findIndex((img) => img.id === photoId);
  activeGalleryIndex.value = nextIndex >= 0 ? nextIndex : 0;
  activeGalleryPhotoId.value = photoId;
  isGalleryOpen.value = true;

  nextTick(() => {
    requestAnimationFrame(() => {
      isGalleryOpening.value = false;
    });
  });
}

function handleSlideChange(index: number) {
  activeGalleryIndex.value = index;
  const activePhoto = imgs.value[index];
  activeGalleryPhotoId.value = activePhoto?.id ?? null;
}

const galleryWindowStart = computed(() => {
  const total = imgs.value.length;
  if (total <= galleryWindowSize.value) {
    return 0;
  }

  const centeredStart = Math.max(
    activeGalleryIndex.value - galleryWindowHalf.value,
    0,
  );
  return Math.min(centeredStart, total - galleryWindowSize.value);
});

const galleryWindowImgs = computed(() => {
  const start = galleryWindowStart.value;
  return imgs.value.slice(start, start + galleryWindowSize.value);
});

const galleryWindowStartIndex = computed(() => {
  return Math.max(activeGalleryIndex.value - galleryWindowStart.value, 0);
});

function handleWindowedSlideChange(windowIndex: number) {
  const absoluteIndex = galleryWindowStart.value + windowIndex;
  handleSlideChange(absoluteIndex);
}

function trimGalleryMemory() {
  const maxItems = maxInMemoryItems.value;
  if (imgs.value.length <= maxItems) {
    return;
  }

  imgs.value = imgs.value.slice(0, maxItems);

  if (activeGalleryIndex.value >= imgs.value.length) {
    activeGalleryIndex.value = Math.max(imgs.value.length - 1, 0);
    activeGalleryPhotoId.value =
      imgs.value[activeGalleryIndex.value]?.id ?? null;
  }
}

function showOfflineNotice() {
  if (offlineNoticeShown.value) {
    return;
  }

  showWarning(OFFLINE_NOTICE);
  offlineNoticeShown.value = true;
  onlineNoticeShown.value = false;
}

function showOnlineNotice() {
  if (onlineNoticeShown.value) {
    return;
  }

  showInfo(ONLINE_NOTICE);
  onlineNoticeShown.value = true;
  offlineNoticeShown.value = false;
}

if (route.query.code) {
  try {
    await $fetch("/api/passcode/verify", {
      method: "POST",
      body: { code: route.query.code },
    });
    await refreshSession(); // Refresh session to update user state
    // Remove query param on success
    router.replace({ query: {} });
  } catch (e) {
    console.error("Invalid passcode", e);
  }
}

async function getPhotos() {
  if (isGalleryOpen.value || isGalleryOpening.value) return;
  if (!hasMore.value || isFetchingPage.value) return;

  isFetchingPage.value = true;

  try {
    const res = await $fetch<PhotosResponse>("/api/photos", {
      query: {
        limit: 10,
        cursor: cursor.value,
      },
    });

    imgs.value.push(...res.imgs);
    trimGalleryMemory();
    hasMore.value = res.hasMore;
    cursor.value = res.cursor;
    lastSyncedAt.value = Date.now();
  } catch {
    if (!navigator.onLine) {
      showOfflineNotice();
    }
  } finally {
    isLoading.value = false;
    isFetchingPage.value = false;
  }
}

async function refreshFromStart() {
  if (!navigator.onLine) {
    isLoading.value = false;
    showOfflineNotice();
    return;
  }

  const res = await $fetch<PhotosResponse>("/api/photos", {
    query: {
      limit: 10,
    },
  });

  imgs.value = [...res.imgs];
  trimGalleryMemory();
  hasMore.value = res.hasMore;
  cursor.value = res.cursor;
  lastSyncedAt.value = Date.now();
  isLoading.value = false;
}

async function checkForUpdates(force = false) {
  if (isGalleryOpen.value || isGalleryOpening.value) return;
  if (isRefreshing.value || isFetchingPage.value) return;

  const staleEnough = Date.now() - lastSyncedAt.value > REFRESH_THROTTLE_MS;
  if (!force && !staleEnough) return;

  if (!navigator.onLine) {
    if (imgs.value.length > 0) {
      showOfflineNotice();
    }
    return;
  }

  isRefreshing.value = true;

  try {
    const res = await $fetch<PhotosResponse>("/api/photos", {
      query: {
        limit: 10,
      },
    });

    if (imgs.value.length === 0) {
      imgs.value = [...res.imgs];
      hasMore.value = res.hasMore;
      cursor.value = res.cursor;
      lastSyncedAt.value = Date.now();
      return;
    }

    const knownIds = new Set(imgs.value.map((img) => img.id));
    const unseen = res.imgs.filter((img) => !knownIds.has(img.id));
    if (unseen.length > 0) {
      imgs.value = [...unseen, ...imgs.value];
      trimGalleryMemory();
      showInfo(
        `Gallery updated with ${unseen.length} new item${unseen.length > 1 ? "s" : ""}.`,
      );
    }

    lastSyncedAt.value = Date.now();
  } catch {
    if (!navigator.onLine) {
      showOfflineNotice();
    }
  } finally {
    isRefreshing.value = false;
  }
}

function handleOffline() {
  showOfflineNotice();
}

function handleOnline() {
  showOnlineNotice();
  checkForUpdates(true);
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible") {
    checkForUpdates();
  }
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  if (isGalleryOpen.value || isGalleryOpening.value) {
    return;
  }

  const entry = entries[0];
  if (entry?.isIntersecting) {
    getPhotos();
  }
}

watch(
  imgs,
  (nextImgs) => {
    if (!isGalleryOpen.value || !activeGalleryPhotoId.value) {
      return;
    }

    const nextIndex = nextImgs.findIndex(
      (img) => img.id === activeGalleryPhotoId.value,
    );
    if (nextIndex >= 0) {
      activeGalleryIndex.value = nextIndex;
      return;
    }

    activeGalleryIndex.value = 0;
    activeGalleryPhotoId.value = nextImgs[0]?.id ?? null;
  },
  { deep: false },
);

watch(isGalleryOpen, (open) => {
  if (!observer) {
    return;
  }

  if (open) {
    observer.disconnect();
    return;
  }

  if (bottomOfPageRef.value) {
    observer.observe(bottomOfPageRef.value);
  }
});

watch(
  [
    imgs,
    hasMore,
    cursor,
    activeGalleryIndex,
    activeGalleryPhotoId,
    isGalleryOpen,
    isGalleryOpening,
    isLoading,
    isRefreshing,
    isFetchingPage,
  ],
  () => {
    persistGalleryCrashContext();
  },
  { deep: false },
);

let observer: IntersectionObserver | null = null;

onMounted(async () => {
  updateCrashDebugState();
  persistGalleryCrashContext();

  if (imgs.value.length === 0) {
    await refreshFromStart();
  } else {
    isLoading.value = false;
    checkForUpdates();
  }

  observer = new IntersectionObserver(handleIntersection, {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  });
  if (bottomOfPageRef.value) {
    observer.observe(bottomOfPageRef.value);
  }

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);
  document.addEventListener("visibilitychange", handleVisibilityChange);
});
onUnmounted(() => {
  persistGalleryCrashContext();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <main class="main" :class="{ 'is-loading': isLoading }">
    <IconCircleLoading v-if="isLoading" class="icon-loading" />
    <div class="img-gallery">
      <BaseThumbnail
        v-for="img in imgs"
        :key="img.id"
        class="base-thumbnail"
        :img="img"
        @click.stop.prevent="openGallery(img.id)"
      />
      <div ref="bottomOfPageRef" class="bottom-of-page" />
    </div>
    <!-- {{ user ? "Logged in" : "Not logged in" }} -->
    <div v-if="user" class="btn-container">
      <button class="btn btn-primary" @click="isModalOpen = true">
        Share a Memory
      </button>
    </div>
    <BaseModal
      class="modal-upload"
      :is-shown="isModalOpen"
      @closed="isModalOpen = false"
    >
      <template #header>
        <button class="btn btn-close" @click="isModalOpen = false">
          <IconClose />
        </button>
      </template>
      <UploadForm @success="handleUploadSuccess" />
    </BaseModal>

    <!-- Gallery Modal -->
    <BaseModal
      :is-shown="isGalleryOpen"
      size="full"
      @closed="isGalleryOpen = false"
    >
      <GalleryCarousel
        v-if="isGalleryOpen"
        :imgs="galleryWindowImgs"
        :start-index="galleryWindowStartIndex"
        @slide-change="handleWindowedSlideChange"
        @close="isGalleryOpen = false"
      />
    </BaseModal>

    <div class="toast-container">
      <BaseToast
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :message="toast.message"
        :duration="toast.duration"
        @close="removeToast(toast.id)"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
main.main {
  flex-grow: 1;
  &.is-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}
.img-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: rem(1);
  background-color: $white;

  .base-thumbnail {
    width: 100%;
    aspect-ratio: 1 / 1;
    cursor: pointer;
    overflow: hidden; // Ensures content doesn't spill out if image is different aspect ratio

    // Target the inner image/picture
    :deep(img),
    :deep(picture) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }
}
.bottom-of-page {
  height: 1px;
  opacity: 0;
}
.btn-container {
  position: fixed;
  bottom: 1rem;
  text-align: center;
  width: 100%;
  :deep(.btn) {
    @include shadow-2();
  }
}
.modal-upload {
  .btn-close {
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
}
.icon-loading {
  height: rem(100);
  width: rem(100);
}

.toast-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}
</style>
