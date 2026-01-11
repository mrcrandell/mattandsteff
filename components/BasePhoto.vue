<script setup>
const props = defineProps({
  photo: {
    type: String,
    required: true,
  },
  post: {
    type: String,
  }
});
const emit = defineEmits('post-update');
const isModalOpen = ref(false);
const updatedPost = ref(post);

function handleUpdate() {
  emit('post-update', updatedPost.value);
}
</script>

<template>
  <div class="photo-container">
    <img :src="photo" alt="Photo" @click="isModalOpen = true" class="photo-preview" />
    <BaseModal class="modal-photo" :isShown="isModalOpen" @closed="isModalOpen = false">
      <button class="btn-close" @click="isModalOpen = false">
        <IconClose />
      </button>
      <img :src="photo" alt="Photo" />
      <div class="form-group">
        <textarea
          v-model="updatedPost"
          placeholder="leave a comment if you'd like..."
          class="form-control"
          @change="handleUpdate"
        ></textarea>
      </div>
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>
.photo-container {
  // max-width: 600px;
  // margin-left: auto;
  // margin-right: auto;

  img.photo-preview {
    max-width: 100%;
    height: auto;
    aspect-ratio: 1/1;
    object-fit: cover;
    cursor: pointer;
  }
  .modal-photo img {
    max-width: 100%;
    height: auto;
  }
}
</style>