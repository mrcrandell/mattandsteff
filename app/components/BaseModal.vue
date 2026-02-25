<script setup lang="ts">
import { ref, watch, useSlots } from "vue";

const slots: any = useSlots();

const prop = defineProps({
  isShown: {
    type: Boolean,
    default: false,
  },
  isDisableClosingOnMask: {
    type: Boolean,
    default: false,
  },
  disableScrolling: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String,
    default: "md",
  },
});
const emit = defineEmits(["closed"]);
const isShownComplete = ref(false);

function close() {
  emit("closed");
}
function closeFromMask() {
  if (prop.isDisableClosingOnMask) return;
  close();
}
watch(
  () => prop.isShown,
  () => {
    function disableScroll() {
      document.body.style.overflow = "hidden";
    }
    function enableScroll() {
      document.body.style.overflow = "auto";
    }
    if (prop.isShown) {
      if (!prop.disableScrolling) {
        disableScroll();
      }
      setTimeout(() => {
        isShownComplete.value = true;
      }, 100);
    } else {
      enableScroll();
      isShownComplete.value = false;
    }
  },
);
</script>

<template>
  <Transition name="modal-fade">
    <div
      v-if="isShown"
      class="modal"
      tabindex="-1"
      :class="{ show: isShownComplete }"
      @click.self="closeFromMask"
    >
      <div class="modal-dialog" :class="`modal-${prop.size}`">
        <div class="modal-content">
          <div class="modal-header" v-if="slots.header">
            <slot name="header"></slot>
          </div>
          <div class="modal-body">
            <slot></slot>
          </div>
          <div class="modal-footer" v-if="slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.modal-dialog {
  position: relative;
  z-index: 1055;
  width: auto;
  margin: 8px;
  pointer-events: none;
  transition: transform 0.3s ease-out;
  width: 100%;

  @include bp-sm-phone-landscape {
    max-width: 500px;
    margin-right: auto;
    margin-left: auto;
  }

  &.modal-lg {
    @include bp-sm-phone-landscape {
      max-width: 800px;
    }
  }

  &.modal-full {
    margin: 0;
    max-width: 100%;
    min-height: 100%;

    @include bp-sm-phone-landscape {
      max-width: 100%;
      margin: 0;
    }

    .modal-content {
      min-height: 100vh;
      border-radius: 0;
      background: transparent;
    }

    .modal-body {
      padding: 0;
    }
  }
}

.modal {
  position: fixed;
  inset: 0;
  z-index: 1055;
  overflow: hidden auto;
  background-color: rgba($color: #000, $alpha: 50%);
  backdrop-filter: blur(4px);
  outline: 0;

  display: flex;
  align-items: center;
}

.modal-content {
  pointer-events: auto;
  background-color: $gray-900;
  color: $white;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.5s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  .modal-dialog,
  .loading-content {
    transform: translate(0, -50px);
  }
}

.modal-body {
  padding: rem(30);
}
</style>
