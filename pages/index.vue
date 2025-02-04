<script setup>
const images = ref([])
const hasMore = ref(true)
const cursor = ref()
const res = await $fetch('/api/photos', {
    query: {
      limit: 3,
      cursor: cursor.value
    }
  })
  images.value.push(...res.blobs)
  hasMore.value = res.hasMore
  cursor.value = res.cursor
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
    <!-- <img src="/images/785899511132-5840a42b.jpg"> -->
    <div v-for="drawing in images" :key="drawing.pathname" class="flex flex-col gap-2">
      <img :src="`/photos/${drawing.pathname}`" :alt="drawing.pathname" />
      <div class="flex items-center justify-between">
        <span>{{ drawing.customMetadata?.userName }}</span>
        <span class="text-xs text-gray-500">{{ drawing.uploadedAt }}</span>
      </div>
    </div>
  </div>
</template>
