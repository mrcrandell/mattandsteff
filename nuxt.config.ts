const enablePwa = process.env.NUXT_PUBLIC_ENABLE_PWA === "true";

export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxtjs/google-fonts",
    "@nuxtjs/turnstile",
    "@vite-pwa/nuxt",
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
      title: "Matt & Steff",
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
        {
          name: "viewport",
          content: "width=device-width,initial-scale=1,viewport-fit=cover",
        },
        { name: "theme-color", content: "#ffffff" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "default",
        },
        { name: "apple-mobile-web-app-title", content: "Matt & Steff" },
        { name: "robots", content: "noindex, nofollow" },
      ],
    },
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Matt & Steff",
      short_name: "Matt & Steff",
      id: "/",
      scope: "/",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      start_url: "/",
      orientation: "portrait",
      icons: [
        {
          src: "/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      screenshots: [
        {
          src: "/pwa-screenshot-wide.svg",
          sizes: "1280x720",
          type: "image/svg+xml",
          form_factor: "wide",
          label: "Desktop gallery view",
        },
        {
          src: "/pwa-screenshot-mobile.svg",
          sizes: "720x1280",
          type: "image/svg+xml",
          label: "Mobile gallery view",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,png,svg,ico,webmanifest}"],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/admin(?:\/|$)/, /^\/admin-login(?:\/|$)/],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/(admin|upload)(?:\/|$)/,
          handler: "NetworkOnly",
          method: "GET",
        },
        {
          urlPattern: /^\/api\/passcode\/verify(?:\/|$)/,
          handler: "NetworkOnly",
          method: "POST",
        },
        {
          urlPattern: /^\/api\/(admin|upload)(?:\/|$)/,
          handler: "NetworkOnly",
          method: "POST",
        },
        {
          urlPattern: /^\/api\/photos(?:\?.*)?$/,
          handler: "StaleWhileRevalidate",
          method: "GET",
          options: {
            cacheName: "gallery-api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/assets\.mattandsteff\.com\/.*/,
          handler: "StaleWhileRevalidate",
          method: "GET",
          options: {
            cacheName: "gallery-assets-cache",
            expiration: {
              maxEntries: 300,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^\/photos\/.*/,
          handler: "StaleWhileRevalidate",
          method: "GET",
          options: {
            cacheName: "gallery-photos-cache",
            expiration: {
              maxEntries: 300,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
    client: {
      registerPlugin: enablePwa,
      installPrompt: false,
    },
    devOptions: {
      enabled: false,
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
      enablePwa,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ||
        "https://www.mattandsteff.com",
      assetUrl: process.env.NUXT_ASSET_URL || "https://assets.mattandsteff.com",
    },
    session: {
      password: process.env.NUXT_SESSION_PASSWORD || "",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        domain: process.env.NODE_ENV === "production"
          ? (process.env.NUXT_SESSION_COOKIE_DOMAIN || ".mattandsteff.com")
          : undefined,
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
