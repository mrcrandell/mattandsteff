<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import IconClose from "./icons/IconClose.vue";

const props = defineProps<{
  type?: "success" | "danger" | "warning" | "info";
  message: string;
  duration?: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const isVisible = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

function close() {
  isVisible.value = false;
}

onMounted(() => {
  isVisible.value = true;

  if (props.duration !== 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration || 1500);
  }
});

onUnmounted(() => {
  if (timer) clearTimeout(timer);
});
</script>

<template>
  <Transition name="toast-fade" @after-leave="$emit('close')">
    <div
      v-if="isVisible"
      class="base-toast"
      :class="`toast-${type || 'success'}`"
    >
      <div class="toast-content">{{ message }}</div>
      <button class="toast-close" @click="close">
        <IconClose />
      </button>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.base-toast {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 2000; // Above modal (1055)
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.5rem;
  min-width: 300px;
  max-width: 90vw;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-weight: 500;
  color: $white;

  &.toast-success {
    background-color: $success;
  }

  &.toast-danger {
    background-color: $danger;
  }

  &.toast-warning {
    background-color: $marigold;
    color: $black;
  }

  &.toast-info {
    background-color: $blue;
  }
}

.toast-close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  svg {
    width: 20px;
    height: 20px;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50px);
}
</style>
