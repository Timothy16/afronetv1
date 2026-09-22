// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  typescript: {
    strict: true
  },
  routeRules: {
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
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/image', 'nuxt-gtag'],
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
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        {
          name: 'description',
          content:
            'One identity. One African network. Messaging, files, payments and on-device intelligence that keep working with or without the internet.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap',
        },
        { rel: 'stylesheet', href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css' },
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

  build: {
    transpile: ['vue-toastification'],
  },
})
