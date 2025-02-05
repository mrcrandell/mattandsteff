<script setup>
const uploadRef = ref(null)
const captureRef = ref(null)
const uploadType = ref(null)
const photo = ref(null)
const fileToUpload = ref(null)
const isPhotoLoadingToCanvas = ref(false)
const percentageUploaded = ref(0)

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
  if (input.files && input.files[0]) {
    const reader = new FileReader()
    reader.onload = (e) => {
      photo.value = e.target?.result
    }
    fileToUpload.value = input.files[0]
    reader.readAsDataURL(input.files[0])
  }
}

async function submitPhoto() {
  // Transform the dataURL to a Blob
  // const blob = await fetch(fileToUpload.value).then(res => res.blob())
  // Transform the Blob to a File
  // const file = new File([blob], `drawing.jpg`, { type: 'image/jpeg' })
  // Create the form data
  const form = new FormData()
  form.append('photo', fileToUpload.value)

  // Upload the file to the server
  const resp = await $fetch('/api/upload', {
    method: 'POST',
    body: form
  })
    // .then(() => navigateTo('/'))
    .catch((err) => alert(err.data?.message || err.message))

  console.log(resp)
}
</script>

<template>
  <div class="page-upload">
    <h1>Share Your Memories</h1>
    <input
      ref="uploadRef"
      class="hide-input"
      type="file"
      accept="image/*"
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
    <div
      v-if="!photo"
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

      <!-- Add loading animation -->
      <div
        v-if="photo"
        class="photo-preview"
      >
        <img
          :src="photo"
          alt="Captured Photo"
          @load="isPhotoLoadingToCanvas = false"
        >
      </div>
      <div
        v-else-if="isPhotoLoadingToCanvas"
        class="loading-container"
      >
        <div class="loading">
          Loading...
        </div>
      </div>
      <div class="content-padding">
        <div class="btn-container btn-container-horizontal">
          <button
            v-if="uploadType === 'upload'"
            class="btn btn-outline-primary"
            @click="handleUpload"
          >
            Choose Another
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
            :class="{ 'btn-loading': percentageUploaded > 0 }"
            :disabled="percentageUploaded > 0"
            @click="submitPhoto"
          >
            <span :class="{ 'text-invisible': percentageUploaded > 0 }">Submit</span>
            <!-- <IconLoadingDots
              v-if="percentageUploaded > 0"
              class="icon-loading"
            /> -->
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.page-upload {
  h1, h2 {
    text-align: center;
  }
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
    object-fit: cover;
  }
}
</style>
