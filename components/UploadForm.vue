<script setup lang="ts">
import { ref } from "vue";

const files = ref<File[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
  }
}

function addFiles(newFiles: File[]) {
  files.value.push(...newFiles);
}

function onDrop(event: DragEvent) {
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <div
    class="upload-form"
    :class="{ 'is-dragging': isDragging }"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <div v-if="files.length === 0" class="drop-area" @click="triggerFileInput">
      <div class="icon-container">
        <!-- You can replace this with an actual icon later -->
        <span class="upload-icon">📷</span>
      </div>
      <p>Drag & drop photos here or click to select</p>
      <button class="btn btn-primary">Select Photos</button>
    </div>

    <div v-else class="preview-area">
      <p>{{ files.length }} photos selected</p>
      <button class="btn btn-secondary" @click="triggerFileInput">
        Add more
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden-input"
      @change="onFileSelect"
    />
  </div>
</template>

<style lang="scss" scoped>
.upload-form {
  border: 2px dashed $gray-400;
  padding: 2rem;
  text-align: center;
  border-radius: 8px;
  background-color: $gray-100;
  transition: all 0.2s ease;
  cursor: pointer;
  color: $gray-800;

  &:hover {
    border-color: $gray-600;
    background-color: $gray-200;
  }

  &.is-dragging {
    border-color: $gray-800;
    background-color: $gray-300;
    transform: #{"scale" }(1.02);
  }
}

.drop-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.upload-icon {
  font-size: 3rem;
}

.hidden-input {
  display: none;
}
</style>
