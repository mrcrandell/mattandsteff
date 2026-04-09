export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const pwaEnabled = runtimeConfig.public.enablePwa === true ||
    runtimeConfig.public.enablePwa === "true";

  if (pwaEnabled) {
    return;
  }

  if (!("serviceWorker" in navigator)) {
    return;
  }

  const clearStaleCaches = async () => {
    if (!("caches" in window)) {
      return;
    }

    const cacheNames = await caches.keys();
    const staleCacheNames = cacheNames.filter((name) =>
      /workbox|gallery-|vite-plugin-pwa|nuxt-pwa/i.test(name)
    );

    await Promise.all(staleCacheNames.map((name) => caches.delete(name)));
  };

  const unregisterAllServiceWorkers = async () => {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister()),
    );
  };

  window.addEventListener(
    "load",
    async () => {
      try {
        await unregisterAllServiceWorkers();
        await clearStaleCaches();
      } catch (error) {
        console.warn("PWA recovery cleanup failed", error);
      }
    },
    { once: true },
  );
});
