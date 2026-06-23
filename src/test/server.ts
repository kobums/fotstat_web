import { setupServer } from "msw/node";

// Base URL the API client resolves to in tests (see vitest.config.ts `env`).
export const API_BASE = "http://api.test/api";

// A single shared MSW server. Tests register per-case handlers with
// `server.use(...)`; setup.ts resets them between tests.
export const server = setupServer();
