import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// E2E runs against the Vite dev server with the API mocked at the network layer
// (see e2e/fixtures/mockApi.ts), so no real backend is required. We use a
// dedicated port (5174) and start a fresh server so a developer's own `npm run
// dev` on 5173 isn't reused or disturbed.
const PORT = 5174
const BASE_URL = `http://localhost:${PORT}`

// Single source of truth for the backend origin: derive it from the same
// VITE_API_BASE_URL the app reads, and hand it to the specs (mockApi) via env so
// the two can't drift if .env changes.
const env = loadEnv('development', process.cwd(), 'VITE_')
process.env.E2E_API_ORIGIN = new URL(
  env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8009/api',
).origin

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
