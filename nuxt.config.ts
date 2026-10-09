// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  typescript: {
    strict: true
  },
  routeRules: {
    // The chat page runs the AI in this browser:
    // - ssr false: it must boot from cached files when offline, with no server round trip.
    // - COOP/COEP: multi-threaded WASM needs SharedArrayBuffer, which needs cross-origin
    //   isolation. Scoped to /chat so the rest of the app keeps using Google Cloud images,
    //   analytics and (later) Stripe, which isolation would block. Isolation is per document,
    //   so /chat must be entered with a full page load.
    '/chat': {
      ssr: false,
      // Built as a static page so the service worker can precache it: that file is the shell the
      // installed app opens offline, including for /chat/:id (see workbox.navigateFallback).
      prerender: true,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    '/chat/**': {
      ssr: false,
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },

    // The app's own assets need COEP as well: a dedicated worker started from an isolated page
    // is blocked unless its script carries the header too (the browser reports no reason at all).
    // COEP on a subresource is inert for pages that are not isolated, so other routes are unaffected.
    '/_nuxt/**': {
      headers: { 'Cross-Origin-Embedder-Policy': 'require-corp' },
    },

    // Open CORS without credentials: cross-origin callers can't ride the session
    // cookie. ('*' with Allow-Credentials is rejected by browsers anyway.)
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Max-Age': '86400'
      }
    }
  },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/image', 'nuxt-gtag', '@vite-pwa/nuxt'],
  css: ['vue-toastification/dist/index.css'],

  app: {
    head: {
      title: 'Afronet — The internet you can carry with you',
      htmlAttrs: {
        lang: 'en',
        style: '-webkit-font-smoothing: antialiased;',
      },
      // The font is set on body, not only on the layouts, because dialogs are
      // teleported to <body> and would otherwise fall back to the browser serif.
      bodyAttrs: {
        style: "background-color: #ffffff; color: #121614; margin: 0; font-family: Inter, ui-sans-serif, system-ui, sans-serif;",
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'theme-color', content: '#0b5d3e' },
        // Installed app on iOS: full-screen, with a dark status bar over the white app.
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Afronet' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'One identity. One African network. Messaging, files, payments and on-device intelligence that keep working with or without the internet.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
        // Fonts are served by this app: the installed app must render correctly offline, and
        // /chat is cross-origin isolated. See public/fonts/fonts.css.
        { rel: 'stylesheet', href: '/fonts/fonts.css' },
        // Icons still come from a CDN for the rest of the app; /chat draws its own (AiIcon), so
        // it needs nothing cross-origin.
        {
          rel: 'stylesheet',
          crossorigin: 'anonymous',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
        },
      ],
      // The only rules that cannot live on a component: the focus ring for every
      // element, and the two scrollbar treatments used across the shell, windows
      // and dialogs. Kept here so the project needs no global stylesheet.
      style: [
        {
          innerHTML: `
            *:focus-visible { outline: 2px solid #0b5d3e; outline-offset: 2px; }
            .afro-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
            .afro-scroll::-webkit-scrollbar-thumb { background: #e4e4de; border-radius: 999px; }
            .afro-scroll::-webkit-scrollbar-track { background: transparent; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { scrollbar-width: none; }
          `,
        },
      ],
    },
  },

  // Runtime config
  runtimeConfig: {

    googleCloud: {
      projectId: "",
      clientEmail: "",
      privateKey: "",
      storageBucket: "",
    },

    mongodbUri: "",
    baseUrl: "",
    resendApiKey: '',
    transcodingUrl: "",
    transcodingApiKey: "",
    geminiApiKey: "",
    deepseekApiKey: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    sessionSecret: "",

    public: {
      apiBase: '/api',
      appUrl: "",
      stripePublishableKey: "",
    }
  },

  // Installable app. The chat is the offline entry point: it is the only route that can start
  // without the server, because the AI and the conversations are already on the device.
  pwa: {
    // Not autoUpdate: an update that reloads the page by itself would wipe a reply in progress.
    registerType: 'prompt',
    manifest: {
      name: 'Afronet',
      short_name: 'Afronet',
      description: 'One identity. One African network. African intelligence that works offline.',
      lang: 'en',
      start_url: '/chat',
      scope: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0b5d3e',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // App shell, fonts and the self-hosted AI runtime. Model files are NOT precached:
      // transformers.js keeps those in its own cache, and they are far too large for this list.
      globPatterns: ['**/*.{js,mjs,css,html,ico,png,svg,webmanifest,woff2,wasm}'],
      // The runtime's wasm binary is ~27 MB.
      maximumFileSizeToCacheInBytes: 40 * 1024 * 1024,
      // Offline navigations inside the chat get the cached shell. Other routes are server-rendered
      // and are left alone, so they still behave normally online.
      navigateFallback: '/chat',
      navigateFallbackAllowlist: [/^\/chat/],
      // Never let the service worker cache signed-in API responses: offline data comes from the
      // device's own storage, and stale account data would be worse than none.
      navigateFallbackDenylist: [/^\/api\//],
      cleanupOutdatedCaches: true,
    },
    client: { installPrompt: true },
    // The service worker only runs in production builds.
    devOptions: { enabled: false },
  },

  vite: {
    // In dev, Vite serves /_nuxt itself and never sees Nitro's routeRules, so the worker script
    // would reach the isolated /chat page without COEP and be blocked. Same header, dev path.
    server: { headers: { 'Cross-Origin-Embedder-Policy': 'require-corp' } },
    // The model runs in a Web Worker built as an ES module.
    worker: { format: 'es' },
    // transformers.js ships prebuilt ESM + WASM glue; pre-bundling it breaks the worker in dev.
    optimizeDeps: { exclude: ['@huggingface/transformers'] },
  },

  build: {
    transpile: ['vue-toastification'],
  },
})
