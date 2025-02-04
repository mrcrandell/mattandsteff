// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxthub/core'],
  components: [
    { path: '~/components/icons', pathPrefix: false },
    '~/components',
  ],
  devtools: { enabled: true },
  features: {
    inlineStyles: false,
  },
  compatibilityDate: '2024-11-01',
  hub: {
    blob: true,
  },
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
});