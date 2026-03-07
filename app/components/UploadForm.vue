<script setup lang="ts">
import { v4 as uuidv4 } from "uuid";
import Compressor from "compressorjs";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  mediaType: "IMAGE" | "VIDEO";
  thumbnail?: Blob;
}

const { generateVideoThumbnail, getVideoDuration } = useVideo();

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
    processAndAddFiles(Array.from(input.files));
    input.value = ""; // Reset input so same file can be selected again if needed
  }
}

async function processAndAddFiles(newFiles: File[]) {
  const processedFiles = [];

  for (const file of newFiles) {
    const isVideo = file.type.startsWith("video/");
    let preview = "";
    let thumbnail: Blob | undefined;

    if (isVideo) {
      try {
        thumbnail = await generateVideoThumbnail(file);
        preview = URL.createObjectURL(thumbnail);
      } catch (e) {
        console.error("Failed to generate thumbnail for video", e);
        // Fallback? Ideally show an icon
        preview = "";
      }
    } else {
      preview = URL.createObjectURL(file);
    }

    processedFiles.push({
      id: uuidv4(),
      file,
      preview,
      progress: 0,
      mediaType: isVideo ? ("VIDEO" as const) : ("IMAGE" as const),
      thumbnail,
    });
  }

  files.value.push(...processedFiles);
}

function addFiles(newFiles: File[]) {
  // Deprecated wrapper for backward compatibility if needed, or just redirect
  processAndAddFiles(newFiles);
}

function removeFile(index: number) {
  const file = files.value[index];
  if (file) {
    URL.revokeObjectURL(file.preview);
    files.value.splice(index, 1);
  }
}

// Recording Logic
const isRecording = ref(false);
const recordingTime = ref(30);
const mediaRecorder = ref<MediaRecorder | null>(null);
const recordedChunks = ref<Blob[]>([]);
const stream = ref<MediaStream | null>(null);
const videoPreview = ref<HTMLVideoElement | null>(null);
let timerInterval: any = null;

async function startRecording() {
  errorMessage.value = "";
  try {
    const s = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.value = s;
    recordedChunks.value = [];
    recordingTime.value = 30;
    isRecording.value = true;

    // Wait for next tick to ensure video element is mounted (if used in template)
    await nextTick();
    if (videoPreview.value) {
      videoPreview.value.srcObject = s;
      videoPreview.value.muted = true; // Avoid feedback loop
      videoPreview.value.play();
    }

    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm";
    const recorder = new MediaRecorder(s, { mimeType });
    mediaRecorder.value = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordedChunks.value.push(e.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(recordedChunks.value, { type: mimeType });
      const file = new File(
        [blob],
        `recorded-message-${Date.now()}.${mimeType === "video/mp4" ? "mp4" : "webm"}`,
        { type: mimeType },
      );

      // Stop all tracks
      stopStream();

      // Add to files
      await processAndAddFiles([file]);
      isRecording.value = false;
    };

    recorder.start();

    // Timer
    timerInterval = setInterval(() => {
      recordingTime.value--;
      if (recordingTime.value <= 0) {
        stopRecording();
      }
    }, 1000);
  } catch (err) {
    console.error("Error accessing camera:", err);
    errorMessage.value = "Could not access camera. Please allow permissions.";
    isRecording.value = false;
  }
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stop();
  }
  if (timerInterval) clearInterval(timerInterval);
  isRecording.value = false; // logic in onstop cleans up
}

function cancelRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    // Stop but don't save?
    // Simply stopping triggers onstop which saves.
    // We should clear the handler or set a flag.
    mediaRecorder.value.onstop = null;
    mediaRecorder.value.stop();
  }
  stopStream();
  if (timerInterval) clearInterval(timerInterval);
  isRecording.value = false;
}

function stopStream() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
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

    // Structure request based on mediaType
    const presignResponse = await $fetch<any[]>("/api/upload/presign", {
      method: "POST",
      body: {
        files: files.value.map((f) => ({
          type: f.mediaType === "VIDEO" ? f.file.type : "image/jpeg",
          size: f.file.size,
        })),
      },
    });

    const uploadedAssets: {
      id: string;
      path: string;
      mediaType?: string;
      mimeType?: string;
    }[] = [];
    const totalFiles = files.value.length;

    // 2. Process and Upload each file
    for (let i = 0; i < totalFiles; i++) {
      const fileItem = files.value[i];
      if (!fileItem) continue;

      const presignData = presignResponse[i];

      fileItem.progress = 5; // Started
      uploadProgress.value = `Processing ${fileItem.mediaType === "VIDEO" ? "video" : "photo"} ${i + 1} of ${totalFiles}...`;

      if (fileItem.mediaType === "VIDEO") {
        // Upload Video
        fileItem.progress = 20;

        await fetch(presignData.urls.original, {
          method: "PUT",
          body: fileItem.file,
          headers: { "Content-Type": fileItem.file.type },
        });

        fileItem.progress = 60;

        if (fileItem.thumbnail) {
          // Upload Thumbnail to thumb
          await fetch(presignData.urls.thumb, {
            method: "PUT",
            body: fileItem.thumbnail,
            headers: { "Content-Type": "image/jpeg" },
          });
          // Also push to large if it exists in presign response (reuse thumb)
          if (presignData.urls.large) {
            await fetch(presignData.urls.large, {
              method: "PUT",
              body: fileItem.thumbnail,
              headers: { "Content-Type": "image/jpeg" },
            });
          }
        }

        fileItem.progress = 100;
        uploadedAssets.push({
          id: presignData.id,
          path: presignData.path,
          mediaType: "VIDEO",
          mimeType: fileItem.file.type,
        });
        continue;
      }

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
      uploadedAssets.push({
        id: presignData.id,
        path: presignData.path,
        mediaType: "IMAGE",
        mimeType: "image/jpeg",
      });
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
    :class="{
      'is-dragging': isDragging,
      'is-uploading': isUploading,
      'is-recording': isRecording,
    }"
    @dragenter.prevent="!isUploading && (isDragging = true)"
    @dragover.prevent="!isUploading && (isDragging = true)"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <!-- Recording UI -->
    <div v-if="isRecording" class="recording-overlay">
      <div class="video-container">
        <video
          ref="videoPreview"
          autoplay
          playsinline
          muted
          class="recording-preview"
        ></video>
        <div class="recording-timer">{{ recordingTime }}s</div>
      </div>
      <div class="recording-controls">
        <button class="btn btn-danger" @click="stopRecording">
          Stop & Use
        </button>
        <button class="btn btn-secondary" @click="cancelRecording">
          Cancel
        </button>
      </div>
      <p class="recording-tip">Recording limited to 30 seconds</p>
    </div>

    <!-- Drop Area -->
    <div
      v-else-if="files.length === 0"
      class="drop-area"
      @click="triggerFileInput"
    >
      <div class="icon-container">
        <!-- You can replace this with an actual icon later -->
        <span class="upload-icon">📷</span>
      </div>
      <p>Drag & drop photos/videos here</p>
      <div class="button-group">
        <button class="btn btn-primary" :disabled="isUploading">
          Select Files
        </button>
        <button
          class="btn btn-secondary"
          :disabled="isUploading"
          @click.stop="startRecording"
        >
          Record Video
        </button>
      </div>
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
          :is-video="item.mediaType === 'VIDEO'"
          @remove="removeFile(index)"
        />
      </div>
      <div class="actions">
        <p>
          {{ files.length }} item{{ files.length === 1 ? "" : "s" }} selected
        </p>
        <div class="button-group">
          <button
            class="btn btn-secondary"
            @click="triggerFileInput"
            :disabled="isUploading"
          >
            Add more
          </button>
          <button
            class="btn btn-secondary"
            @click="startRecording"
            :disabled="isUploading"
          >
            Record
          </button>
        </div>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      multiple
      accept="image/*,video/*"
      class="hidden-input"
      @change="onFileSelect"
      @click.stop
    />

    <div class="user-details-form" v-if="!isRecording">
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
              ? `${files.length} Item${files.length === 1 ? "" : "s"}`
              : "Items"
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

.recording-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  padding-bottom: 2rem;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  /* aspect-ratio: 1; square or portrait? */
  margin: 0 auto;
}

.recording-preview {
  width: 100%;
  height: 320px;
  object-fit: cover;
  display: block;
}

/* Mirror the video feed on desktop for natural feel, but maybe not on mobile back camera?
   Usually front camera is mirrored by default in many apps. */
.recording-preview {
  transform: scaleX(-1);
}

.recording-timer {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(220, 53, 69, 0.9);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: bold;
  font-variant-numeric: tabular-nums;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.7;
  }
}

.recording-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  width: 100%;
}

.recording-tip {
  color: #6c757d;
  font-size: 0.875rem;
  margin-top: 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
}
</style>
