// @ts-check

/**
 * ESLint configuration for the project.
 *
 * Uses Nuxt's default ESLint setup and extends it
 * with additional rules for:
 * - Type safety (TypeScript)
 * - Code quality
 * - Security best practices
 */

import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    /**
     * =========================
     * TypeScript Rules
     * =========================
     */

    // Disallow usage of `any` to enforce strict typing
    '@typescript-eslint/no-explicit-any': 'error',

    // Warn about unused variables (ignore variables starting with "_")
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    /**
     * =========================
     * JavaScript / Code Quality
     * =========================
     */

    // Enforce strict equality (=== instead of ==)
    'eqeqeq': ['error', 'always'],

    // Prevent usage of debugger statements
    'no-debugger': 'error',

    // Prefer const over let when variables are not reassigned
    'prefer-const': 'error',

    // Disallow usage of var (use let/const instead)
    'no-var': 'error',

    // Warn on console usage (allow warn and error)
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    /**
     * =========================
     * Security Rules
     * =========================
     */

    // Disallow use of eval() (major security risk)
    'no-eval': 'error',

    // Disallow indirect eval (e.g. setTimeout with string)
    'no-implied-eval': 'error',

    // Disallow Function constructor (similar risk as eval)
    'no-new-func': 'error'
  }
})
