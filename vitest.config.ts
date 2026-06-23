import { defineConfig } from 'vitest/config'

// Vitest config is kept separate from vite.config.ts: Vite 8 (rolldown) and the
// Vite copy bundled by Vitest have incompatible plugin types, so merging them
// would break `tsc -b`. We don't load @vitejs/plugin-react here — the oxc
// transformer (Vite 8 default) already compiles the automatic JSX runtime, so
// component tests need no explicit React import.
export default defineConfig({
  test: {
    // Tests import { describe, it, expect } explicitly rather than relying on
    // globals. jsdom is used everywhere: Phase 1 pure tests run fine under it,
    // and a single environment keeps the shared setup (RTL cleanup, MSW) simple.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Restore spies (vi.spyOn) to their originals after each test so suites
    // don't have to repeat afterEach(restoreAllMocks).
    restoreMocks: true,
    // The API client reads VITE_API_BASE_URL at import time and throws if unset.
    env: { VITE_API_BASE_URL: 'http://api.test/api' },
  },
})
