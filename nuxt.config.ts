
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxthub/core', "@nuxtjs/google-fonts", '@nuxtjs/turnstile'],
  googleFonts: {
    families: {
      'Josefin+Sans': true,
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
  turnstile: {
    siteKey: '0x4AAAAAAA8dgDkgtYLmL6gf',
    addValidateEndpoint: true,
  },
  hub: {
    blob: true,
  },
  runtimeConfig: {
    turnstile: {
      // This can be overridden at runtime via the NUXT_TURNSTILE_SECRET_KEY
      // environment variable.
      secretKey: '',
    },
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

