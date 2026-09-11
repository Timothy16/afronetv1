// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  typescript: {
    strict: true
  },
  routeRules: {
    '/api/**': {
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    }
  },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/image', 'nuxt-gtag'],
  css: ['vue-toastification/dist/index.css'],

  app: {
    head: {
      title: 'Afronet',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/x-icon',
          href: '/magdalene.png'
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,300;1,6..72,400&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css'
        },
        {
          rel: 'stylesheet',
          href: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/fontawesome.min.css'
        },
      ]
    }
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
