<script setup lang="ts">
import { is } from "zod/v4/locales";

definePageMeta({
  layout: "admin",
});

const config = useRuntimeConfig();
const { user, session } = useUserSession();
// console.log(toRaw(session.value));
const admin = computed<Partial<Admin>>(() => session.value?.admin || {});
const {
  toasts,
  removeToast,
  error: showError,
  success: showSuccess,
} = useToast();

const imgs = ref<any[]>([]);
const hasMore = ref(true);
const cursor = ref();
const bottomOfPageRef = ref(null);
const selectedPhoto = ref<any>(null);
const isModalOpen = ref(false);
const isDeleteConfirmationModalOpen = ref(false);
const isDeleteConfirmation = ref(false);

function openPhoto(photo: any) {
  selectedPhoto.value = photo;
  isModalOpen.value = true;
}

async function deletePhoto() {
  if (!selectedPhoto.value) return;

  try {
    const res = await $fetch<{ success: boolean }>("/api/admin/photos/delete", {
      method: "POST",
      body: { id: selectedPhoto.value.id },
    });

    if (res.success) {
      showSuccess("Photo deleted successfully");
      imgs.value = imgs.value.filter(
        (img) => img.id !== selectedPhoto.value.id,
      );
      isModalOpen.value = false;
      isDeleteConfirmationModalOpen.value = false;
      selectedPhoto.value = null;
    }
  } catch (error) {
    console.error("Failed to delete photo", error);
    showError("Failed to delete photo");
  }
}

async function toggleVisibility(photo: any) {
  try {
    const res = await $fetch<{ success: boolean; isHidden: boolean }>(
      "/api/admin/photos/toggle-visibility",
      {
        method: "POST",
        body: { id: photo.id },
      },
    );
    if (res.success) {
      photo.isHidden = res.isHidden;
      showSuccess(res.isHidden ? "Photo hidden" : "Photo visible");
    }
  } catch (error) {
    console.error("Failed to toggle visibility", error);
    showError("Failed to update photo visibility");
  }
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
        :class="{ 'is-hidden': img.isHidden }"
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
          <button
            class="btn btn-admin btn-info"
            @click="toggleVisibility(selectedPhoto)"
          >
            {{ selectedPhoto.isHidden ? "Unhide Photo" : "Hide Photo" }}
          </button>
          <button
            class="btn btn-admin btn-danger"
            @click="isDeleteConfirmationModalOpen = true"
          >
            Delete Photo
          </button>
        </div>
      </div>
    </BaseModal>

    <BaseModal
      :isShown="isDeleteConfirmationModalOpen"
      @closed="isDeleteConfirmationModalOpen = false"
      size="md"
    >
      <div class="confirmation-content">
        <h3>Delete Photo?</h3>
        <p>
          Are you sure you want to delete this photo? This action cannot be
          undone.
        </p>
        <div class="modal-footer">
          <button
            class="btn btn-admin btn-outline-blue"
            @click="isDeleteConfirmationModalOpen = false"
          >
            Cancel
          </button>
          <button class="btn btn-admin btn-danger" @click="deletePhoto">
            Confirm Delete
          </button>
        </div>
      </div>
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
  </div>
</template>

<style lang="scss" scoped>
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
    position: relative !important;
    bottom: auto !important;
    left: auto !important;
  }
}
.img-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: rem(1);

  .base-thumbnail {
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;

    &.is-hidden {
      opacity: 0.5;
      filter: Grayscale(100%);
      position: relative;

      &::after {
        content: "HIDDEN";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.2rem 0.5rem;
        font-size: 0.8rem;
        border-radius: 4px;
        font-weight: bold;
      }
    }

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

  .confirmation-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    text-align: center;

    h3 {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .modal-footer {
      border: none;
      padding-top: 2rem;
      justify-content: center;
    }
  }
}
.photo-modal-content,
.confirmation-content {
  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }
}
</style>
