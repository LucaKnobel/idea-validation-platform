import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n', '@nuxt/content', 'nuxt-security'],

  devtools: {
    enabled: false
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    logLevel: '',
    smtpHost: '',
    smtpPort: '',
    smtpSecure: '',
    smtpUser: '',
    smtpPass: '',
    smtpFrom: '',
    public: {
      appVersion: 'dev',
      appCommit: 'local',
      appChannel: 'local',
      appDeployedAt: 'unknown',
      appImageTag: 'unknown'
    }
  },

  alias: {
    '@server': fileURLToPath(new URL('./server', import.meta.url)),
    '@interfaces': fileURLToPath(new URL('./server/application/interfaces', import.meta.url)),
    '@infrastructure': fileURLToPath(new URL('./server/infrastructure', import.meta.url)),
    '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    '@generated': fileURLToPath(new URL('./generated', import.meta.url))
  },

  devServer: {
    host: '0.0.0.0',
    port: 3000
  },

  compatibilityDate: '2025-01-15',

  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        noUncheckedIndexedAccess: true
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    strategy: 'prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' }
    ]
  },

  security: {
    corsHandler: {
      // Only allow explicit origins
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN_WWW].filter((origin): origin is string => Boolean(origin))
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true
    }
  }
})
