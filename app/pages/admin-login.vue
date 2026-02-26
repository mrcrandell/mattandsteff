<script setup lang="ts">
definePageMeta({ layout: false });

const { fetch } = useUserSession();

const email = ref("");
const password = ref("");
const loading = ref(false);

const alert = ref({
  show: false,
  status: "",
  message: "",
});

const errors = ref<Record<string, string>>({});

const submitText = computed(() => {
  return loading.value ? "Logging in..." : "Login";
});

async function login() {
  loading.value = true;
  alert.value.show = false;
  errors.value = {};

  const result = loginValidation.safeParse({
    email: email.value,
    password: password.value,
  });

  if (!result.success) {
    loading.value = false;
    alert.value = {
      show: true,
      status: "danger",
      message: "Please correct the errors on the form.",
    };

    result.error.issues.forEach((issue) => {
      const field = issue.path[0];
      if (typeof field === "string") {
        errors.value[field] = issue.message;
      }
    });
    return;
  }

  try {
    await $fetch("/api/admin/login", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
      },
    });

    // Refresh session
    await fetch();

    await navigateTo("/admin");
  } catch (err: any) {
    alert.value = {
      show: true,
      status: "danger",
      message: err.data?.message || "Login failed",
    };
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="admin-layout">
    <div class="login-form">
      <h1>
        <span class="logo-container"><LogoIcon /></span>
        <span>Admin</span>
      </h1>

      <form method="post" novalidate @submit.prevent="login">
        <div
          v-if="alert.show"
          class="alert"
          role="alert"
          :class="'alert-' + alert.status"
        >
          {{ alert.message }}
        </div>

        <div class="form-group">
          <label for="login-email">Email</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            class="form-control"
            name="email"
            :class="{ 'is-invalid': errors.email }"
            placeholder="Email"
            autocomplete="username"
          />
          <div v-if="errors.email" class="invalid-feedback">
            {{ errors.email }}
          </div>
        </div>

        <div class="form-group">
          <label for="login-password">Password</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="form-control"
            name="password"
            :class="{ 'is-invalid': errors.password }"
            placeholder="Password"
            autocomplete="current-password"
          />
          <div v-if="errors.password" class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>

        <div class="form-group form-group-submit">
          <button
            type="submit"
            class="btn btn-submit btn-primary"
            :disabled="loading"
          >
            <transition name="slide-fade" mode="out-in">
              <span :key="submitText">{{ submitText }}</span>
            </transition>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// @use "@/assets/scss/admin-layout.scss" as *;
.admin-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  min-height: 100vh;
}
.login-form {
  width: 100%;
  max-width: 400px;
  h1 {
    text-align: center;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    .logo-container {
      display: flex;
      width: 2rem;
      height: 2rem;
    }
  }
  p {
    text-align: center;
    margin-top: 2rem;
  }
}
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

.form-group-submit {
  margin-top: 1rem;
  button {
    width: 100%;
  }
}
</style>
