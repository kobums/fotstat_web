import type { Page } from '@playwright/test'

// The backend origin, derived from VITE_API_BASE_URL by playwright.config.ts so
// it can't drift from .env. We intercept this *origin* rather than `**/api/**`
// so we don't accidentally catch the app's own source modules under
// /src/core/api/* (which would be served as JSON and break the app's boot).
const API_ORIGIN = process.env.E2E_API_ORIGIN ?? 'http://127.0.0.1:8009'

export interface MockTeam {
  id: number
  user: number
  name: string
}
export interface MockState {
  teams: MockTeam[]
  nextId: number
}

/**
 * Intercept the app's backend API with a small in-memory backend so E2E specs
 * run deterministically without a real server. Returns the mutable state so a
 * spec can seed or inspect it.
 */
export async function mockApi(page: Page): Promise<MockState> {
  const state: MockState = { teams: [], nextId: 1 }

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const { pathname } = new URL(request.url())
    // Strip the `/api` base path so handlers below match on the bare route.
    const path = pathname.replace(/^\/api/, '')
    const method = request.method()
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })

    // --- Auth ---
    if (path === '/guest' && method === 'POST') {
      return json({
        code: 'ok',
        token: 'e2e-token',
        user: { id: 1, name: '게스트', email: 'guest:1' },
      })
    }

    // --- Teams ---
    if (path === '/team' && method === 'GET') {
      return json({ code: 'ok', items: state.teams, total: state.teams.length })
    }
    if (path === '/team' && method === 'POST') {
      // postDataJSON() is null when the body is missing/unparseable.
      const body = (request.postDataJSON() ?? {}) as { name?: string }
      if (!body.name) return json({ code: 'error', message: 'name required' })
      const team: MockTeam = { id: state.nextId++, user: 1, name: body.name }
      state.teams.push(team)
      return json({ code: 'ok', id: team.id })
    }

    // Sensible defaults for any other endpoint the page happens to hit.
    if (method === 'GET') return json({ code: 'ok', items: [] })
    return json({ code: 'ok' })
  })

  return state
}
