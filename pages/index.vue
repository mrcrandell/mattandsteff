<script setup>
const images = ref([])
const hasMore = ref(true)
const cursor = ref()
const bottomOfPageRef = ref(null);
async function getPhotos() {
  if (!hasMore.value) return;
  const res = await $fetch('/api/photos', {
    query: {
      limit: 10,
      cursor: cursor.value
    }
  })
  images.value.push(...res.blobs);
  hasMore.value = res.hasMore
  cursor.value = res.cursor
}

function handleIntersection(entries) {
  const entry = entries[0]
  if (entry.isIntersecting) {
    getPhotos()
  }
}

let observer

onMounted(() => {
  observer = new IntersectionObserver(handleIntersection, {
    root: null,
    rootMargin: '0px',
    threshold: 1.0
  })
  if (bottomOfPageRef.value) {
    observer.observe(bottomOfPageRef.value)
  }
});
onUnmounted(() => {
  if (observer && bottomOfPageRef.value) {
    observer.unobserve(bottomOfPageRef.value)
  }
});
</script>

<template>
  <div class="img-gallery">
    <BasePhoto v-for="drawing in images" :key="drawing.pathname" :photo="`/photos/${drawing.pathname}`" />
    <div ref="bottomOfPageRef" class="bottom-of-page"></div>
  </div>
</template>

<style lang="scss" scoped>
.bottom-of-page {
  height: 1px;
  opacity: 0;
}
</style>
