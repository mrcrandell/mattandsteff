<script setup lang="ts">
const { clear } = useUserSession();
const showResetModal = ref(false);
const isResetting = ref(false);
const resetPassword = ref("");
const resetError = ref("");

async function logout() {
  await clear();
  await navigateTo("/admin-login");
}

function handleClose() {
  showResetModal.value = false;
  resetPassword.value = "";
  resetError.value = "";
}

async function handleReset() {
  if (isResetting.value) return;

  if (!resetPassword.value) {
    resetError.value = "Password is required";
    return;
  }

  isResetting.value = true;
  resetError.value = "";

  try {
    await $fetch("/api/admin/reset", {
      method: "POST",
      body: {
        password: resetPassword.value,
      },
    });
    showResetModal.value = false;
    window.location.reload();
  } catch (error: any) {
    console.error(error);
    resetError.value = error.data?.message || "Failed to reset system.";
  } finally {
    isResetting.value = false;
  }
}
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <nav>
        <ul>
          <li><NuxtLink to="/admin">Dashboard</NuxtLink></li>

          <li class="spacer"></li>
          <li>
            <button class="btn-reset" @click="showResetModal = true">
              Reset Everything
            </button>
          </li>

          <li><button @click="logout">Logout</button></li>
        </ul>
      </nav>
    </aside>
    <main class="admin-content">
      <slot />
    </main>

    <BaseModal :isShown="showResetModal" @closed="handleClose">
      <div class="modal-header">
        <h3>Reset Everything?</h3>
      </div>
      <div class="modal-body">
        <p>
          Are you sure you want to delete all photos, posts, and users? This
          action cannot be undone.
        </p>

        <div class="form-group mt-3">
          <label for="admin-password">Confirm with Password</label>
          <input
            id="admin-password"
            v-model="resetPassword"
            type="password"
            class="form-control"
            placeholder="Enter password"
            @keyup.enter="handleReset"
            :disabled="isResetting"
          />
          <div v-if="resetError" class="text-danger mt-1 small">
            {{ resetError }}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleClose">Cancel</button>
        <button
          class="btn btn-danger"
          @click="handleReset"
          :disabled="isResetting"
        >
          {{ isResetting ? "Resetting..." : "Yes, Reset Everything" }}
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped lang="scss">
.admin-layout {
  display: flex;
  min-height: 100vh;
}
.admin-sidebar {
  width: 250px;
  background-color: #f4f4f4;
  padding: 1rem;
  display: flex;
  flex-direction: column;
}
.admin-content {
  flex: 1;
  padding: 2rem;
}
nav {
  height: 100%;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}
li {
  margin-bottom: 0.5rem;
}
.spacer {
  margin-top: auto;
}
button {
  cursor: pointer;
  background: none;
  border: none;
  color: blue;
  text-decoration: underline;
  padding: 0;
  font-size: 1rem;
}
.btn-reset {
  color: red;
  font-weight: bold;
}

/* Modal Internal Styles */
.modal-header {
  margin-bottom: 1rem;
  h3 {
    margin: 0;
  }
}
.modal-body {
  margin-bottom: 1.5rem;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;

  .btn {
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    color: white;
    font-weight: bold;
    border: none;
    cursor: pointer;

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  .btn-secondary {
    background-color: #6c757d;
    &:hover {
      background-color: #5a6268;
    }
  }

  .btn-danger {
    background-color: #dc3545;
    &:hover {
      background-color: #c82333;
    }
  }
}
</style>
