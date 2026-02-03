<script setup lang="ts">
import { ref, onUnmounted, computed } from "vue";
import { v4 as uuidv4 } from "uuid";
import Compressor from "compressorjs";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
}

const { user } = useUserSession();
const files = ref<UploadFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref("");

const name = ref((user.value as any)?.name || "");
const phone = ref((user.value as any)?.phone || "");
const message = ref("");
const errorsRaw = ref<any[]>([]);

const errors = computed(() => {
  const errors: Record<string, string> = {};
  errorsRaw.value.forEach((error) => {
    const [field] = error.path;
    errors[field] = error.message;
  });
  return errors;
});

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    addFiles(Array.from(input.files));
    input.value = ""; // Reset input so same file can be selected again if needed
  }
}

function addFiles(newFiles: File[]) {
  const newUploadFiles = newFiles.map((file) => ({
    id: uuidv4(),
    file,
    preview: URL.createObjectURL(file),
  }));
  files.value.push(...newUploadFiles);
}

function removeFile(index: number) {
  const file = files.value[index];
  if (file) {
    URL.revokeObjectURL(file.preview);
    files.value.splice(index, 1);
  }
}

// Helper function to compress image
const compressImage = (
  file: File | Blob,
  options: Compressor.Options,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      ...options,
      success(result) {
        resolve(result);
      },
      error(err) {
        reject(err);
      },
    });
  });
};

async function submitForm() {
  errorsRaw.value = [];

  const formData = {
    name: name.value,
    phone: phone.value,
    message: message.value,
  };

  const { error } = uploadValidation.validate(formData, {
    abortEarly: false,
  });

  if (error) {
    errorsRaw.value = error.details;
    return;
  }

  isUploading.value = true;
  uploadProgress.value = "Starting upload...";

  try {
    // 1. Get Presigned URLs
    uploadProgress.value = "Preparing upload...";
    // We assume all files will be converted to JPEG, so we request signed URLs for JPEGs.
    const presignResponse = await $fetch<any[]>("/api/upload/presign", {
      method: "POST",
      body: {
        files: files.value.map(() => ({ type: "image/jpeg", size: 0 })),
      },
    });

    const uploadedAssets = [];
    const totalFiles = files.value.length;

    // 2. Process and Upload each file
    for (let i = 0; i < totalFiles; i++) {
      const fileItem = files.value[i];
      const presignData = presignResponse[i];

      uploadProgress.value = `Processing photo ${i + 1} of ${totalFiles}...`;

      let sourceBlob: Blob = fileItem.file;

      // HEIC Conversion
      if (
        fileItem.file.type === "image/heic" ||
        fileItem.file.name.toLowerCase().endsWith(".heic")
      ) {
        const heic2any = (await import("heic2any")).default;
        // heic2any can return Blob or Blob[]
        const converted = await heic2any({
          blob: fileItem.file,
          toType: "image/jpeg",
        });
        sourceBlob = Array.isArray(converted) ? converted[0] : converted;
      }

      // Generate Variants
      uploadProgress.value = `Compressing photo ${i + 1} of ${totalFiles}...`;
      const [original, large, thumb] = await Promise.all([
        // Original: Max 4000x4000, Q90
        compressImage(sourceBlob, {
          maxWidth: 4000,
          maxHeight: 4000,
          quality: 0.9,
          mimeType: "image/jpeg",
        }),
        // Large: Max 2560x2560, Q85
        compressImage(sourceBlob, {
          maxWidth: 2560,
          maxHeight: 2560,
          quality: 0.85,
          mimeType: "image/jpeg",
        }),
        // Thumb: Width 400, Q75
        compressImage(sourceBlob, {
          maxWidth: 400,
          quality: 0.75,
          mimeType: "image/jpeg",
        }),
      ]);

      uploadProgress.value = `Uploading photo ${i + 1} of ${totalFiles}...`;

      // Upload to R2
      await Promise.all([
        fetch(presignData.urls.original, {
          method: "PUT",
          body: original,
          headers: { "Content-Type": "image/jpeg" },
        }),
        fetch(presignData.urls.large, {
          method: "PUT",
          body: large,
          headers: { "Content-Type": "image/jpeg" },
        }),
        fetch(presignData.urls.thumb, {
          method: "PUT",
          body: thumb,
          headers: { "Content-Type": "image/jpeg" },
        }),
      ]);

      uploadedAssets.push({ id: presignData.id, path: presignData.path });
    }

    // 3. Finalize
    uploadProgress.value = "Finalizing...";
    await $fetch("/api/upload/finalize", {
      method: "POST",
      body: {
        name: name.value,
        phone: phone.value,
        message: message.value,
        assets: uploadedAssets,
      },
    });

    // Clear form on success
    files.value = [];
    message.value = "";
    // name/phone might persist
    alert("Upload successful!");
  } catch (err: any) {
    console.error(err);
    alert(err.data?.message || err.message || "Upload failed");
  } finally {
    isUploading.value = false;
    uploadProgress.value = "";
  }
}

onUnmounted(() => {
  files.value.forEach((f) => URL.revokeObjectURL(f.preview));
});

function onDrop(event: DragEvent) {
  if (isUploading.value) return;
  isDragging.value = false;
  if (event.dataTransfer?.files) {
    addFiles(Array.from(event.dataTransfer.files));
  }
}

function triggerFileInput() {
  if (isUploading.value) return;
  fileInput.value?.click();
}
</script>

<template>
  <div
    class="upload-form"
    :class="{ 'is-dragging': isDragging, 'is-uploading': isUploading }"
    @dragenter.prevent="!isUploading && (isDragging = true)"
    @dragover.prevent="!isUploading && (isDragging = true)"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <div v-if="files.length === 0" class="drop-area" @click="triggerFileInput">
      <div class="icon-container">
        <!-- You can replace this with an actual icon later -->
        <span class="upload-icon">📷</span>
      </div>
      <p>Drag & drop photos here or click to select</p>
      <button class="btn btn-primary" :disabled="isUploading">
        Select Photos
      </button>
    </div>

    <div v-else class="preview-area">
      <div class="image-grid">
        <div
          v-for="(item, index) in files"
          :key="item.id"
          class="image-preview"
        >
          <img :src="item.preview" :alt="item.file.name" />
          <button
            v-if="!isUploading"
            class="remove-btn"
            @click.stop="removeFile(index)"
          >
            <!-- IconClose -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <div class="actions">
        <p>
          {{ files.length }} photo{{ files.length === 1 ? "" : "s" }} selected
        </p>
        <button
          class="btn btn-secondary"
          @click="triggerFileInput"
          :disabled="isUploading"
        >
          Add more
        </button>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="hidden-input"
      @change="onFileSelect"
      @click.stop
    />

    <div class="user-details-form">
      <div class="form-group">
        <label for="name" class="form-label sr-only">Name</label>
        <input
          id="name"
          v-model="name"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errors.name }"
          placeholder="Your Name"
          :disabled="isUploading"
        />
        <div v-if="errors.name" class="invalid-feedback">
          {{ errors.name }}
        </div>
      </div>

      <div class="form-group">
        <label for="phone" class="form-label sr-only">Phone Number</label>
        <input
          id="phone"
          v-model="phone"
          type="tel"
          class="form-control"
          :class="{ 'is-invalid': errors.phone }"
          placeholder="Your Phone Number"
          :disabled="isUploading"
        />
        <div v-if="errors.phone" class="invalid-feedback">
          {{ errors.phone }}
        </div>
      </div>

      <div class="form-group">
        <label for="message" class="form-label sr-only"
          >Message (Optional)</label
        >
        <textarea
          id="message"
          v-model="message"
          class="form-control"
          placeholder="Add a message (optional)"
          rows="3"
          :disabled="isUploading"
        ></textarea>
      </div>

      <button
        class="btn btn-primary btn-submit"
        :disabled="files.length === 0 || isUploading"
        @click="submitForm"
      >
        <span v-if="isUploading">{{ uploadProgress }}</span>
        <span v-else>
          Upload
          {{
            files.length > 0
              ? `${files.length} Photo${files.length === 1 ? "" : "s"}`
              : "Photos"
          }}
        </span>
      </button>
    </div>
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

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.image-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: $gray-300;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba($black, 0.6);
    color: $white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;

    &:hover {
      background: rgba($black, 0.8);
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-details-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
  border-top: 1px solid $gray-300;
  padding-top: 2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-submit {
  margin-top: 1rem;
  align-self: flex-start;
  width: 100%;
}
</style>
