export default defineNuxtConfig({
  ssr: false,
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'YONGKOKU — Narrative Growth Experience',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Fredoka:wght@400;500;600&family=Nunito:wght@300;400;500;600;700&display=swap' }
      ]
    }
  },
  compatibilityDate: '2025-01-01'
})
