<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <nav>
        <ul>
          <li><NuxtLink to="/admin">Dashboard</NuxtLink></li>
          <!-- Add more links later -->
          <li><button @click="logout">Logout</button></li>
        </ul>
      </nav>
    </aside>
    <main class="admin-content">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { clear } = useUserSession()

async function logout() {
  await clear()
  await navigateTo('/admin-login')
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}
.admin-sidebar {
  width: 250px;
  background-color: #f4f4f4;
  padding: 1rem;
}
.admin-content {
  flex: 1;
  padding: 2rem;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 0.5rem;
}
button {
  cursor: pointer;
  background: none;
  border: none;
  color: blue;
  text-decoration: underline;
  padding: 0;
}
</style>
