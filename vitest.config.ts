import { defineConfig } from 'vitest/config'

// Vitest config is kept separate from vite.config.ts: Vite 8 (rolldown) and the
// Vite copy bundled by Vitest have incompatible plugin types, so merging them
// would break `tsc -b`. Phase 1 tests are pure logic and need no React plugin.
// Phase 2 (component/hook tests) can add `@vitejs/plugin-react` and switch
// individual files to jsdom via a `// @vitest-environment jsdom` comment.
export default defineConfig({
  test: {
    // Tests import { describe, it, expect } explicitly rather than relying on
    // globals, so no `globals: true` and no `vitest/globals` types are needed.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
