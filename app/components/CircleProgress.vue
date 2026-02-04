<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  progress: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 0 && value <= 100,
  },
  size: {
    type: Number,
    default: 60,
  },
  strokeWidth: {
    type: Number,
    default: 6,
  },
});

const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => {
  return circumference.value - (props.progress / 100) * circumference.value;
});

const isComplete = computed(() => props.progress >= 100);
</script>

<template>
  <div
    class="circle-progress"
    :class="{ 'is-complete': isComplete }"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <svg
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
      class="progress-ring"
    >
      <!-- Background Circle -->
      <circle
        class="progress-ring-circle-bg"
        :stroke-width="strokeWidth"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
      />
      <!-- Progress Circle -->
      <circle
        class="progress-ring-circle"
        :stroke-width="strokeWidth"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
        :style="{
          strokeDasharray: `${circumference} ${circumference}`,
          strokeDashoffset: dashOffset,
        }"
      />
    </svg>

    <div class="content">
      <div v-if="isComplete" class="checkmark">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span v-else class="percentage">{{ Math.round(progress) }}%</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.circle-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.progress-ring-circle-bg {
  stroke: $gray-300;
  fill: transparent;
}

.progress-ring-circle {
  stroke: $primary;
  stroke-linecap: round;
  fill: transparent;
  transition:
    stroke-dashoffset 0.35s ease,
    stroke 0.35s ease;
}

.content {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $primary;
  font-weight: 600;
  font-size: 0.9em;
}

.checkmark {
  color: $white;
  width: 50%;
  height: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    height: 100%;
  }
}

// Complete State
.is-complete {
  .progress-ring-circle {
    stroke: $success;
  }

  .progress-ring-circle-bg {
    stroke: transparent; // Hide background or match success
  }

  // Optional: Fill the circle when complete
  .progress-ring-circle-bg {
    fill: $success;
    stroke: $success;
    transition: fill 0.3s ease 0.1s; // Slight delay to fill
  }
}
</style>
