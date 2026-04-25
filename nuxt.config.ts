// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  alias: {
    '@server': fileURLToPath(new URL('./server', import.meta.url)),
    '@generated': fileURLToPath(new URL('./generated', import.meta.url))
  },

  routeRules: {
    '/': { prerender: true }
  },

  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  compatibilityDate: '2025-01-15',

  typescript: {
    typeCheck: true
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
