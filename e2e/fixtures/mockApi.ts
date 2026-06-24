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
export interface MockPlayer {
  id: number
  team: number
  name: string
  number: number
  position: string
}
export interface MockMatch {
  id: number
  team: number
  awayname: string
  matchdate: string
}
export interface MockState {
  teams: MockTeam[]
  players: MockPlayer[]
  matches: MockMatch[]
  nextId: number
}

export interface MockSeed {
  teams?: MockTeam[]
  players?: MockPlayer[]
  matches?: MockMatch[]
}

/**
 * Intercept the app's backend API with a small in-memory backend so E2E specs
 * run deterministically without a real server. Pass `seed` to start with some
 * data already present. Returns the mutable state so a spec can inspect it.
 */
export async function mockApi(page: Page, seed: MockSeed = {}): Promise<MockState> {
  const state: MockState = {
    teams: seed.teams ?? [],
    players: seed.players ?? [],
    matches: seed.matches ?? [],
    nextId: 100,
  }

  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    // Strip the `/api` base path so handlers below match on the bare route.
    const path = url.pathname.replace(/^\/api/, '')
    const method = request.method()
    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      })
    // postDataJSON() is null when the body is missing/unparseable.
    const body = (request.postDataJSON() ?? {}) as Record<string, unknown>

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
      if (!body.name) return json({ code: 'error', message: 'name required' })
      const team: MockTeam = { id: state.nextId++, user: 1, name: String(body.name) }
      state.teams.push(team)
      return json({ code: 'ok', id: team.id })
    }
    const teamDetail = /^\/team\/(\d+)$/.exec(path)
    if (teamDetail && method === 'GET') {
      const team = state.teams.find((t) => t.id === Number(teamDetail[1]))
      return json({ code: 'ok', item: team })
    }

    // --- Players ---
    if (path === '/player' && method === 'GET') {
      const teamId = Number(url.searchParams.get('team'))
      const items = state.players.filter((p) => p.team === teamId)
      return json({ code: 'ok', items, total: items.length })
    }
    if (path === '/player' && method === 'POST') {
      const player: MockPlayer = {
        id: state.nextId++,
        team: Number(body.team),
        name: String(body.name),
        number: Number(body.number),
        position: String(body.position),
      }
      state.players.push(player)
      return json({ code: 'ok', id: player.id })
    }

    // --- Matches ---
    if (path === '/match' && method === 'GET') {
      // The schedule page asks twice: upcoming (startmatchdate) and past
      // (endmatchdate). Keep it simple and deterministic by serving every
      // match as "past" and nothing as "upcoming".
      const isUpcoming = url.searchParams.has('startmatchdate')
      const items = isUpcoming ? [] : state.matches
      return json({ code: 'ok', items, total: items.length })
    }
    if (path === '/match' && method === 'POST') {
      const match: MockMatch = {
        id: state.nextId++,
        team: Number(body.team),
        awayname: String(body.awayname),
        matchdate: String(body.matchdate),
      }
      state.matches.push(match)
      return json({ code: 'ok', id: match.id })
    }

    // Sensible defaults for any other endpoint the page happens to hit.
    if (method === 'GET') return json({ code: 'ok', items: [] })
    return json({ code: 'ok' })
  })

  return state
}
