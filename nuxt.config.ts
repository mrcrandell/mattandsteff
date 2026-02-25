export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/google-fonts",
    "@nuxtjs/turnstile",
    "nuxt-auth-utils",
  ],
  googleFonts: {
    families: {
      "Josefin+Sans": true,
      "Abhaya+Libre": {
        wght: "400;500;600;700;800",
      },
    },
    display: "swap",
  },
  components: [
    { path: "~/components/icons", pathPrefix: false },
    "~/components",
  ],
  devtools: { enabled: true },
  features: {
    inlineStyles: false,
  },
  app: {
    head: {
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: "/favicon-96x96.png",
          sizes: "96x96",
        },
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "shortcut icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
      meta: [
        { name: "apple-mobile-web-app-title", content: "Matt & Steff" },
      ],
    },
  },
  compatibilityDate: "2024-11-01",
  turnstile: {
    siteKey: "0x4AAAAAAA8dgDkgtYLmL6gf",
    addValidateEndpoint: true,
  },
  runtimeConfig: {
    passcode: "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ||
        "https://www.mattandsteff.com",
      assetUrl: process.env.NUXT_ASSET_URL || "https://assets.mattandsteff.com",
    },
    session: {
      password: "",
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
    },
    turnstile: {
      // This can be overridden at runtime via the NUXT_TURNSTILE_SECRET_KEY
      // environment variable.
      secretKey: "",
    },
    r2: {
      accountId: "",
      accessKeyId: "",
      secretAccessKey: "",
      bucketName: "",
      publicUrl: "",
    },
  },
  eslint: {
    config: {
      stylistic: true, // <---
    },
  },
  nitro: {
    experimental: {
      openAPI: true,
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler", // or "modern"
          silenceDeprecations: ["import"],
          additionalData: `
            @use "sass:math" as *;
            @use "sass:color" as *;
            @use "sass:map" as *;
            @use "@/assets/scss/_functions.scss" as *;
            @use "@/assets/scss/_variables.scss" as *;
            @use "@/assets/scss/_mixins.scss" as *;
          `,
          quietDeps: true,
        },
        sass: {
          quietDeps: true,
        },
      },
    },
  },
});
