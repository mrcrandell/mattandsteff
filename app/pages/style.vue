<script setup lang="ts">
import BaseThumbnailUpload from "@/components/BaseThumbnailUpload.vue";

const animatedProgress = ref(0);
let interval: ReturnType<typeof setInterval>;

onMounted(() => {
  interval = setInterval(() => {
    animatedProgress.value = (animatedProgress.value + 1) % 105;
  }, 100);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div class="page-style">
    <h1>Style Guide</h1>

    <button class="btn btn-primary">Primary Button</button>
    <button class="btn btn-outline-primary">Outline Primary Button</button>

    <h2>Forms</h2>
    <form class="row g-3">
      <div class="col-md-4">
        <label for="validationServer01" class="form-label">First name</label>
        <input
          type="text"
          class="form-control is-valid"
          id="validationServer01"
          value="Mark"
          required
        />
        <div class="valid-feedback">Looks good!</div>
      </div>
      <div class="col-md-4">
        <label for="validationServer02" class="form-label">Last name</label>
        <input
          type="text"
          class="form-control is-valid"
          id="validationServer02"
          value="Otto"
          required
        />
        <div class="valid-feedback">Looks good!</div>
      </div>
      <div class="col-md-4">
        <label for="validationServerUsername" class="form-label"
          >Username</label
        >
        <div class="input-group has-validation">
          <span class="input-group-text" id="inputGroupPrepend3">@</span>
          <input
            type="text"
            class="form-control is-invalid"
            id="validationServerUsername"
            aria-describedby="inputGroupPrepend3 validationServerUsernameFeedback"
            required
          />
          <div id="validationServerUsernameFeedback" class="invalid-feedback">
            Please choose a username.
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <label for="validationServer03" class="form-label">City</label>
        <textarea
          class="form-control is-invalid"
          id="validationServer03"
          aria-describedby="validationServer03Feedback"
          required
        ></textarea>
        <div id="validationServer03Feedback" class="invalid-feedback">
          Please provide a valid city.
        </div>
      </div>
      <div class="col-md-3">
        <label for="validationServer04" class="form-label">State</label>
        <select
          class="form-select is-invalid"
          id="validationServer04"
          aria-describedby="validationServer04Feedback"
          required
        >
          <option selected disabled value="">Choose...</option>
          <option>...</option>
        </select>
        <div id="validationServer04Feedback" class="invalid-feedback">
          Please select a valid state.
        </div>
      </div>
      <div class="col-md-3">
        <label for="validationServer05" class="form-label">Zip</label>
        <input
          type="text"
          class="form-control is-invalid"
          id="validationServer05"
          aria-describedby="validationServer05Feedback"
          required
        />
        <div id="validationServer05Feedback" class="invalid-feedback">
          Please provide a valid zip.
        </div>
      </div>
      <div class="col-12">
        <div class="form-check">
          <input
            class="form-check-input is-invalid"
            type="checkbox"
            value=""
            id="invalidCheck3"
            aria-describedby="invalidCheck3Feedback"
            required
          />
          <label class="form-check-label" for="invalidCheck3">
            Agree to terms and conditions
          </label>
          <div id="invalidCheck3Feedback" class="invalid-feedback">
            You must agree before submitting.
          </div>
        </div>
      </div>
      <div class="col-12">
        <button class="btn btn-primary" type="submit">Submit form</button>
      </div>
    </form>

    <h2 class="mt-4">Upload Components</h2>
    <div class="d-flex gap-3">
      <div style="width: 120px">
        <BaseThumbnailUpload
          preview="https://placehold.co/200"
          alt="0%"
          :progress="0"
          :show-remove="true"
        />
        <p class="text-center mt-2">0%</p>
      </div>
      <div style="width: 120px">
        <BaseThumbnailUpload
          preview="https://placehold.co/200"
          alt="45%"
          :progress="45"
          :show-remove="false"
        />
        <p class="text-center mt-2">45%</p>
      </div>
      <div style="width: 120px">
        <BaseThumbnailUpload
          preview="https://placehold.co/200"
          alt="Animated"
          :progress="animatedProgress"
          :show-remove="false"
        />
        <p class="text-center mt-2">Animated</p>
      </div>
      <div style="width: 120px">
        <BaseThumbnailUpload
          preview="https://placehold.co/200"
          alt="No Remove"
          :progress="100"
          :show-remove="false"
        />
        <p class="text-center mt-2">No Remove</p>
      </div>
    </div>
  </div>
</template>
