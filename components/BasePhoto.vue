<script setup>
const props = defineProps({
  photo: {
    type: String,
    required: true,
  },
});
const isModalOpen = ref(false);

</script>

<template>
  <div class="photo-container">
    <img :src="photo" alt="Photo" @click="isModalOpen = true" class="photo-preview" />
    <BaseModal class="modal-photo" :isShown="isModalOpen" @closed="isModalOpen = false">
      <button class="btn-close" @click="isModalOpen = false">
        <IconClose />
      </button>
      <img :src="photo" alt="Photo" />
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