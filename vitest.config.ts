import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { loadEnv } from 'vite'
import { fileURLToPath } from 'node:url'

const testEnv = loadEnv('test', process.cwd(), '')

const alias = {
  '@server': fileURLToPath(new URL('./server', import.meta.url)),
  '@interfaces': fileURLToPath(new URL('./server/application/interfaces', import.meta.url)),
  '@infrastructure': fileURLToPath(new URL('./server/infrastructure', import.meta.url)),
  '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
  '@generated': fileURLToPath(new URL('./generated', import.meta.url))
}

export default defineConfig({
  test: {
    env: testEnv,
    watch: false,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node'
        }
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt'
        }
      }),
      {
        resolve: { alias },
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.{test,spec}.ts'],
          exclude: ['test/e2e/global-setup.ts', 'test/e2e/auth-test-helpers.ts'],
          environment: 'node',
          globalSetup: ['test/e2e/global-setup.ts'],
          fileParallelism: false,
          pool: 'forks',
          maxWorkers: 1
        }
      }
    ]
  }
})
