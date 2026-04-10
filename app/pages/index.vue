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
const isModalOpen = ref(false);
const isGalleryOpen = ref(false);
const activeGalleryIndex = ref(0);
const isLoading = ref(imgs.value.length === 0);
const isRefreshing = ref(false);
const isFetchingPage = ref(false);
const offlineNoticeShown = ref(false);
const onlineNoticeShown = ref(false);

async function handleUploadSuccess() {
  isLoading.value = true;
  await refreshFromStart();
  await new Promise((resolve) => setTimeout(resolve, 500));
  isModalOpen.value = false;
  showSuccess("Upload successful!");
}

function openGallery(index: number) {
  activeGalleryIndex.value = index;
  isGalleryOpen.value = true;
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
  hasMore.value = res.hasMore;
  cursor.value = res.cursor;
  lastSyncedAt.value = Date.now();
  isLoading.value = false;
}

async function checkForUpdates(force = false) {
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
  const entry = entries[0];
  if (entry?.isIntersecting) {
    getPhotos();
  }
}

let observer: IntersectionObserver | null = null;

onMounted(async () => {
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
  if (observer && bottomOfPageRef.value) {
    observer.unobserve(bottomOfPageRef.value);
  }

  window.removeEventListener("online", handleOnline);
  window.removeEventListener("offline", handleOffline);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <main class="main" :class="{ 'is-loading': isLoading }">
    <IconCircleLoading class="icon-loading" v-if="isLoading" />
    <div class="img-gallery">
      <BaseThumbnail
        class="base-thumbnail"
        v-for="(img, index) in imgs"
        :key="img.id"
        :img="img"
        @click="openGallery(index)"
      />
      <div ref="bottomOfPageRef" class="bottom-of-page"></div>
    </div>
    <!-- {{ user ? "Logged in" : "Not logged in" }} -->
    <div v-if="user" class="btn-container">
      <button class="btn btn-primary" @click="isModalOpen = true">
        Share a Memory
      </button>
    </div>
    <BaseModal
      class="modal-upload"
      :isShown="isModalOpen"
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
      :isShown="isGalleryOpen"
      size="full"
      @closed="isGalleryOpen = false"
    >
      <GalleryCarousel
        v-if="isGalleryOpen"
        :imgs="imgs"
        :start-index="activeGalleryIndex"
        @slide-change="(index) => (activeGalleryIndex = index)"
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
