<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import Compressor from "compressorjs";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
}

const { user } = useUserSession();
const files = ref<UploadFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);
const emit = defineEmits(["success"]);
const isDragging = ref(false);
const isUploading = ref(false);
const uploadProgress = ref("");

const name = ref((user.value as any)?.name || "");
const phone = ref((user.value as any)?.phone || "");
const message = ref("");
const errorsRaw = ref<any[]>([]);
const errorMessage = ref("");

const errors = computed(() => {
  const errors: Record<string, string> = {};
  errorsRaw.value.forEach((error) => {
    const [field] = error.path;
    errors[field] = error.message;
  });
  return errors;
});

const overallProgress = computed(() => {
  if (files.value.length === 0) return 0;
  const total = files.value.reduce((acc, file) => acc + file.progress, 0);
  return total / files.value.length;
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
    progress: 0,
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
  errorMessage.value = "";

  const formData = {
    name: name.value,
    phone: phone.value,
    message: message.value,
  };

  const result = uploadValidation.safeParse(formData);

  if (!result.success) {
    errorsRaw.value = result.error.issues;
    errorMessage.value = "Please check the form for errors.";
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
      if (!fileItem) continue;

      const presignData = presignResponse[i];

      fileItem.progress = 5; // Started
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
        const result = Array.isArray(converted) ? converted[0] : converted;
        if (!result) throw new Error("Failed to convert HEIC image");
        sourceBlob = result;

        fileItem.progress = 20; // Converted
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

      fileItem.progress = 60; // Compressed
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

      fileItem.progress = 100; // Uploaded
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

    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX

    // Clear form on success
    files.value = [];
    message.value = "";
    // name/phone might persist
    emit("success");
  } catch (err: any) {
    console.error(err);
    errorMessage.value =
      err.data?.message || err.message || "Upload failed. Please try again.";
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
        <BaseThumbnailUpload
          v-for="(item, index) in files"
          :key="item.id"
          :preview="item.preview"
          :alt="item.file.name"
          :progress="item.progress"
          :show-remove="!isUploading"
          @remove="removeFile(index)"
        />
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
      <div v-if="errorMessage" class="alert alert-danger">
        {{ errorMessage }}
      </div>

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

      <BtnProgress
        :progress="overallProgress"
        :loading="isUploading"
        :disabled="files.length === 0"
        @click="submitForm"
        class="btn-submit"
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
      </BtnProgress>
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
