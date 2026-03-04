<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const config = useRuntimeConfig();
const { user, session } = useUserSession();
// console.log(toRaw(session.value));
const admin = computed<Partial<Admin>>(() => session.value?.admin || {});

const imgs = ref<any[]>([]);
const hasMore = ref(true);
const cursor = ref();
const bottomOfPageRef = ref(null);
const selectedPhoto = ref<any>(null);
const isModalOpen = ref(false);

function openPhoto(photo: any) {
  selectedPhoto.value = photo;
  isModalOpen.value = true;
}

async function getPhotos() {
  if (!hasMore.value) return;
  const res = await $fetch<any>("/api/photos", {
    query: {
      limit: 10,
      cursor: cursor.value,
    },
  });
  imgs.value.push(...res.imgs);
  hasMore.value = res.hasMore;
  cursor.value = res.cursor;
}

function handleIntersection(entries: IntersectionObserverEntry[]) {
  const entry = entries[0];
  if (entry?.isIntersecting) {
    getPhotos();
  }
}

let observer: IntersectionObserver;

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
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome back, {{ admin?.name }}!</p>
    <p>Role: {{ admin?.role }}</p>

    <div class="img-gallery">
      <BaseThumbnail
        class="base-thumbnail"
        v-for="img in imgs"
        :key="img.id"
        :img="img"
        @click="openPhoto(img)"
      />
      <div ref="bottomOfPageRef" class="bottom-of-page"></div>
    </div>

    <BaseModal
      :isShown="isModalOpen"
      :size="selectedPhoto?.width > selectedPhoto?.height ? 'xl' : 'lg'"
      @closed="
        () => {
          selectedPhoto = null;
          isModalOpen = false;
        }
      "
    >
      <div v-if="selectedPhoto" class="photo-modal-content">
        <div class="photo-container">
          <picture>
            <img
              :src="`${config.public.assetUrl}${selectedPhoto.urls.large}`"
              alt="Photo"
              loading="lazy"
            />
          </picture>
        </div>
        <div class="modal-footer">
          <button class="btn btn-admin btn-info">Hide Photo</button>
          <button class="btn btn-admin btn-danger">Delete Photo</button>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>
.img-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: rem(1);

  .base-thumbnail {
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;

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

.photo-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .photo-container {
    width: 100%;

    img {
      width: 100%;
      height: auto;
      max-height: 70vh;
      object-fit: contain;
      display: block;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
}
</style>
