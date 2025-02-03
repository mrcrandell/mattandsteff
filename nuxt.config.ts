// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxthub/core'],
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
  components: [
    { path: '~/components/icons', pathPrefix: false },
    '~/components'
  ],
  features: {
    inlineStyles: false,  
  },
  hub: {
    blod: true
  }
});