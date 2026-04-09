export default defineNitroPlugin(() => {
  const runtimeConfig = useRuntimeConfig();
  const pwaEnabled = runtimeConfig.public.enablePwa === true ||
    runtimeConfig.public.enablePwa === "true";

  console.info(`[PWA] Startup mode: ${pwaEnabled ? "ENABLED" : "DISABLED"}`);
});
