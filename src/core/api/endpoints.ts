// Typed endpoint functions grouped by domain.
// List calls unwrap to T[]; single calls to T; mutations return CodeResponse.

import { api } from "./client";
import type {
  AuthResponse,
  CodeResponse,
  ItemResponse,
  ItemsResponse,
  Match,
  MatchRecord,
  Player,
  Quarter,
  Team,
} from "./types";

function items<T>(res: ItemsResponse<T>): T[] {
  return res.items ?? [];
}

// ---- Auth ----

export const authApi = {
  loginEmail: (email: string, password: string) =>
    api.get<AuthResponse>("/jwt", { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<AuthResponse>("/user", { email, password, name }),
  guest: () => api.post<AuthResponse>("/guest", {}),
  apple: (identityToken: string, authorizationCode?: string, name?: string) =>
    api.post<AuthResponse>("/apple-auth", {
      identityToken,
      authorizationCode,
      name,
    }),
  upgrade: (email: string, password: string, name: string) =>
    api.post<AuthResponse>("/account/upgrade", { email, password, name }),
  deleteAccount: () => api.del<CodeResponse>("/account"),
};

// ---- Team ----

export const teamApi = {
  list: (userId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Team>>("/team", { user: userId }, signal)
      .then(items),
  read: (id: number, signal?: AbortSignal) =>
    api.get<ItemResponse<Team>>(`/team/${id}`, undefined, signal).then((r) => r.item),
  create: (userId: number, name: string) =>
    api.post<CodeResponse>("/team", { user: userId, name }),
  update: (team: Pick<Team, "id" | "user" | "name">) =>
    api.put<CodeResponse>("/team", team),
  remove: (id: number) => api.del<CodeResponse>("/team", { id }),
};

// ---- Player ----

export interface PlayerInput {
  team: number;
  name: string;
  number: number;
  /** "YYYY-MM-DD" or "" when unset. */
  birthdate?: string;
  position: string;
}

export const playerApi = {
  list: (teamId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Player>>("/player", { team: teamId }, signal)
      .then(items),
  create: (input: PlayerInput) => api.post<CodeResponse>("/player", input),
  update: (player: PlayerInput & { id: number }) =>
    api.put<CodeResponse>("/player", player),
  remove: (id: number) => api.del<CodeResponse>("/player", { id }),
};

// ---- Match ----

export interface MatchListParams {
  startmatchdate?: string;
  endmatchdate?: string;
  orderby?: string;
  page?: number;
  pagesize?: number;
}

export const matchApi = {
  list: (teamId: number, params: MatchListParams = {}, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Match>>(
        "/match",
        { team: teamId, ...params },
        signal,
      )
      .then((res) => ({ matches: res.items ?? [], total: res.total })),
  read: (id: number, signal?: AbortSignal) =>
    api
      .get<ItemResponse<Match>>(`/match/${id}`, undefined, signal)
      .then((r) => r.item),
  create: (input: { team: number; awayname: string; matchdate: string }) =>
    api.post<CodeResponse>("/match", input),
  update: (match: { id: number; team: number; awayname: string; matchdate: string }) =>
    api.put<CodeResponse>("/match", match),
  remove: (id: number) => api.del<CodeResponse>("/match", { id }),
};

// ---- Quarter ----

export const quarterApi = {
  list: (matchId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Quarter>>("/quarter", { match: matchId }, signal)
      .then(items),
  create: (input: { match: number; number: number; duration: number }) =>
    api.post<CodeResponse>("/quarter", input),
  updateAwaygoals: (id: number, awaygoals: number) =>
    api.put<CodeResponse>("/quarter/awaygoals", { id, awaygoals }),
  remove: (id: number) => api.del<CodeResponse>("/quarter", { id }),
};

// ---- Record ----

export const recordApi = {
  list: (quarterId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<MatchRecord>>("/record", { quarter: quarterId }, signal)
      .then(items),
  create: (input: {
    quarter: number;
    player: number;
    min: number;
    goal: number;
    assist: number;
    yellowcard: number;
    redcard: number;
  }) => api.post<CodeResponse>("/record", input),
  updateStats: (input: {
    id: number;
    min: number;
    goal: number;
    assist: number;
    yellowcard: number;
    redcard: number;
  }) => api.put<CodeResponse>("/record/stats", input),
  remove: (id: number) => api.del<CodeResponse>("/record", { id }),
};
