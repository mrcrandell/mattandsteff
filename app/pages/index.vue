<script setup>
const imgs = ref([]);
const hasMore = ref(true);
const cursor = ref();
const bottomOfPageRef = ref(null);
const route = useRoute();
const router = useRouter();
const { user, fetch: refreshSession } = useUserSession();
const isModalOpen = ref(false);
const isGalleryOpen = ref(false);
const activeGalleryIndex = ref(0);
const showToast = ref(false);
const toastMessage = ref("");

function handleUploadSuccess() {
  isModalOpen.value = false;
  toastMessage.value = "Upload successful!";
  showToast.value = true;
}

function openGallery(index) {
  console.log(index);
  activeGalleryIndex.value = index;
  isGalleryOpen.value = true;
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
  if (!hasMore.value) return;
  const res = await $fetch("/api/photos", {
    query: {
      limit: 10,
      cursor: cursor.value,
    },
  });
  console.log(toRaw(res));
  imgs.value.push(...res.imgs);
  hasMore.value = res.hasMore;
  cursor.value = res.cursor;
}

function handleIntersection(entries) {
  const entry = entries[0];
  if (entry.isIntersecting) {
    getPhotos();
  }
}

let observer;

onMounted(() => {
  observer = new IntersectionObserver(handleIntersection, {
    root: null,
    rootMargin: "0px",
    threshold: 1.0,
  });
  if (bottomOfPageRef.value) {
    observer.observe(bottomOfPageRef.value);
  }
});
onUnmounted(() => {
  if (observer && bottomOfPageRef.value) {
    observer.unobserve(bottomOfPageRef.value);
  }
});
</script>

<template>
  <main class="main">
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
    {{ user ? "Logged in" : "Not logged in" }}
    <div v-if="user" class="btn-container">
      <button class="btn btn-primary" @click="isModalOpen = true">
        Share a Memory
      </button>
    </div>
    <BaseModal :isShown="isModalOpen" @closed="isModalOpen = false">
      <template #header>
        <h3>Share a Memory</h3>
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

    <BaseToast
      v-if="showToast"
      :message="toastMessage"
      @close="showToast = false"
    />
  </main>
</template>

<style lang="scss" scoped>
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
</style>
