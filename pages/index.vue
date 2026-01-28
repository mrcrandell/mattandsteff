<script setup>
const images = ref([]);
const hasMore = ref(true);
const cursor = ref();
const bottomOfPageRef = ref(null);
const route = useRoute();
const router = useRouter();
const { user, fetch: refreshSession } = useUserSession();
const isModalOpen = ref(false);

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
  images.value.push(...res.blobs);
  hasMore.value = res.hasMore;
  cursor.value = res.cursor;
}

function handleIntersection(entries) {
  const entry = entries[0];
  if (entry.isIntersecting) {
    // getPhotos();
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
      <BasePhoto
        v-for="drawing in images"
        :key="drawing.pathname"
        :photo="`/photos/${drawing.pathname}`"
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
      <UploadForm />
    </BaseModal>
  </main>
</template>

<style lang="scss" scoped>
.bottom-of-page {
  height: 1px;
  opacity: 0;
}
</style>
