<script setup lang="ts">
const { data } = await useFetch('/api/photos')
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
    <div v-for="drawing in data?.blobs" :key="drawing.pathname" class="flex flex-col gap-2">
      <img :src="`/drawings/${drawing.pathname}`" :alt="drawing.pathname" />
      <div class="flex items-center justify-between">
        <span>{{ drawing.customMetadata?.userName }}</span>
        <span class="text-xs text-gray-500">{{ drawing.uploadedAt }}</span>
      </div>
    </div>
  </div>
</template>