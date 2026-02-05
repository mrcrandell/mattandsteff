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
  isValueShown: {
    type: Boolean,
    default: false,
  },
});

const radius = computed(() => props.size / 4);
const circleStrokeWidth = computed(() => props.size / 2);
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
        :stroke-width="circleStrokeWidth"
        :r="radius"
        :cx="size / 2"
        :cy="size / 2"
      />
      <!-- Progress Circle -->
      <circle
        class="progress-ring-circle"
        :stroke-width="circleStrokeWidth"
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
      <span v-else-if="isValueShown" class="percentage"
        >{{ Math.round(progress) }}%</span
      >
    </div>
  </div>
</template>

<style lang="scss" scoped>
.circle-progress {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.is-complete {
    animation: progress-pop 0.25s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

@keyframes progress-pop {
  0% {
    transform: Scale(1);
  }
  40% {
    transform: Scale(0.75);
  }
  80% {
    transform: Scale(1.15);
  }
  100% {
    transform: Scale(1);
  }
}

.progress-ring {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.progress-ring-circle-bg {
  // stroke: rgba($gray-900, 0.1);
  fill: transparent;
}

.progress-ring-circle {
  stroke: $danger;
  stroke-linecap: butt; // Pie chart segments usually have butt caps
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
  color: $gray-900;
  font-weight: 700;
  font-size: 0.8em;
  z-index: 10;
  text-shadow: 0 0 2px $white; // Ensure readability
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
    stroke: transparent;
  }

  .content {
    color: $white;
    text-shadow: none;
  }

  // Optional: Fill the circle when complete
  .progress-ring-circle-bg {
    fill: $success;
    stroke: $success;
    transition: fill 0.3s ease 0.1s;
  }
}
</style>
