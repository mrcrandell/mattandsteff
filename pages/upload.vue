<script setup>
const uploadRef = ref(null)
const captureRef = ref(null)
const uploadType = ref(null)
const photos = ref([])
const filesToUpload = ref([])
const isPhotoLoadingToCanvas = ref(false)
const isLoading = ref(false);
const isCompleteModalOpen = ref(false);
const token = ref(null);

function handleUpload() {
  console.log('upload clicked')
  uploadRef.value.click()
  uploadType.value = 'upload'
}

function handleCapture() {
  console.log('capture clicked')
  captureRef.value.click()
  uploadType.value = 'capture'
}

function handleFileChange(event) {
  isPhotoLoadingToCanvas.value = true
  const input = event.target
  if (input.files) {
    photos.value = [] // Clear previous previews
    filesToUpload.value = input.files
    Array.from(input.files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        photos.value.push(e.target?.result)
      }
      reader.readAsDataURL(file)
    })
  }
}

async function submitPhoto() {
  isLoading.value = true;
  // Create the form data
  const form = new FormData()
  Array.from(filesToUpload.value).forEach(file => {
    // Rename the file
    const extension = file.name.split('.').pop();
    const name = `${new Date('2050-01-01').getTime() - Date.now()}`
    const customName = `${name}.${extension}`;
    const renamedFile = new File([file], customName, { type: file.type });
    console.log(renamedFile);
    form.append('photos', renamedFile);
  });
  // Add Captcha token
  form.append('token', token.value);
  // Upload the file to the server
  const resp = await $fetch('/api/upload', {
    method: 'POST',
    body: form
  })
    // .then(() => navigateTo('/'))
    .catch((err) => alert(err.data?.message || err.message))
  isLoading.value = false;
  console.log(resp);
  isCompleteModalOpen.value = true;
}

function modalClosed() {
  isCompleteModalOpen.value = false;
  // Reset stuff
  photos.value = [];
  filesToUpload.value = [];
}

onMounted(() => {
  // isCompleteModalOpen.value = true;
});
</script>

<template>
  <div class="page-upload">
    <h1>Share Your Memories</h1>
    <input
      ref="uploadRef"
      class="hide-input"
      type="file"
      accept="image/*"
      multiple
      @change="handleFileChange"
    >
    <input
      ref="captureRef"
      class="hide-input"
      type="file"
      accept="image/*"
      capture="camera"
      @change="handleFileChange"
    >
    <NuxtTurnstile v-model="token" />
    <div
      v-if="photos.length === 0"
      class="content-padding"
    >
      <div class="btn-container">
        <button
          class="btn btn-primary"
          @click="handleUpload"
        >
          Upload A Photo
        </button>
        <button
          class="btn btn-primary"
          @click="handleCapture"
        >
          Take A Photo
        </button>
      </div>
    </div>
    <div v-else>
      <div class="content-padding">
        <header class="title">
          <h2>How Does It Look?</h2>
        </header>
      </div>
      <div class="img-gallery">
        <BasePhoto
          v-for="(photo, index) in photos"
          :key="index"
          :photo="photo"
        />
      </div>
      <div class="content-padding">
        <div class="btn-container btn-container-horizontal">
          <button
            v-if="uploadType === 'upload'"
            class="btn btn-outline-primary"
            @click="handleUpload"
          >
            Choose Again
          </button>
          <button
            v-if="uploadType === 'capture'"
            class="btn btn-outline-primary"
            @click="handleCapture"
          >
            Retake
          </button>
          <button
            class="btn btn-primary"
            :class="{ 'btn-loading': isLoading }"
            :disabled="isLoading"
            @click="submitPhoto"
          >
            <span>Submit</span>
            <IconCircleLoading class="icon" v-if="isLoading" />
            <!-- <IconLoadingDots
              v-if="isLoading > 0"
              class="icon-loading"
            /> -->
          </button>
        </div>
      </div>
    </div>
    <BaseModal class="modal-success" :isShown="isCompleteModalOpen" @closed="modalClosed">
      <button class="btn-close" @click="modalClosed">
        <IconClose />
      </button>
      <header class="modal-header">
        <h2>Thank you</h2>
      </header>
      <p><router-link class="btn btn-outline-primary" to="/">See All of the Memories</router-link></p>
      <p><button @click="modalClosed" class="btn btn-outline-primary">Upload More</button></p>
    </BaseModal>
  </div>
</template>

<style lang="scss" scoped>

.page-upload {
  h1, h2 {
    text-align: center;
  }
  h1 {
    margin-bottom: rem(32);
  }
}
.content-padding {
  padding: rem(16);
  max-width: rem(600);
  margin-left: auto;
  margin-right: auto;
}
.btn-container {
  .btn {
    display: flex;
    margin-right: auto;
    margin-bottom: rem(16);
    margin-left: auto;
  }
}

.btn-container-horizontal {
  display: flex;
  gap: rem(20);
  justify-content: center;
}

.hide-input {
  display: none;
}

.photo-preview {
  margin-bottom: rem(24);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;

  img {
    max-width: 100%;
    height: auto;
    aspect-ratio: 1/1;
    object-fit: contain;
  }
}
.modal-success {
  text-align: center;
  h2 {
    margin-bottom: rem(32);
  }
  .btn {
    color: $white;
    &:hover {
      color: $black;
    }
  }
}
</style>
