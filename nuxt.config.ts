
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxthub/core', "@nuxtjs/google-fonts"],
  googleFonts: {
    families: {
      'Domine': {
        wght: '400..700',
      },
      'Abhaya+Libre': {
        wght: '400;500;600;700;800',
      },
    },
    display: 'swap'
  },
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
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler', // or "modern"
          silenceDeprecations: ['import'],
          additionalData: `
            @use "sass:math" as *;
            @use "sass:color" as *;
            @use "sass:map" as *;
            @use "@/assets/scss/_functions.scss" as *;
            @use "@/assets/scss/_variables.scss" as *;
            @use "@/assets/scss/_mixins.scss" as *;
          `,
          quietDeps: true
        },
        sass: {
          quietDeps: true
        },
      },
    },
  },
});

