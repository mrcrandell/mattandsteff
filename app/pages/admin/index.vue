<script setup lang="ts">
definePageMeta({
  layout: "admin",
});

const { user, session } = useUserSession();
// console.log(toRaw(session.value));
const admin = computed<Partial<Admin>>(() => session.value?.admin || {});
</script>

<template>
  <div>
    <h1>Admin Dashboard</h1>
    <p>Welcome back, {{ admin?.name }}!</p>
    <p>Role: {{ admin?.role }}</p>
  </div>
</template>
