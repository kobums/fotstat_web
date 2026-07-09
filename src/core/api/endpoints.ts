// Typed endpoint functions grouped by domain.
// List calls unwrap to T[]; single calls to T; mutations return CodeResponse.

import { api } from "./client";
import type {
  AuthResponse,
  CodeResponse,
  Injury,
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
  /** 서버의 refresh 토큰 폐기 (POST /logout — iOS Endpoint.logout과 동일). */
  logout: () => api.post<CodeResponse>("/logout"),
};

// ---- Team ----

export const teamApi = {
  list: (userId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Team>>("/team", { user: userId }, signal)
      .then(items),
  read: (id: number, signal?: AbortSignal) =>
    api.get<ItemResponse<Team>>(`/team/${id}`, undefined, signal).then((r) => r.item),
  create: (userId: number, name: string, duration?: number) =>
    api.post<CodeResponse>("/team", { user: userId, name, ...(duration ? { duration } : {}) }),
  update: (team: Pick<Team, "id" | "user" | "name" | "duration">) =>
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

// ---- Injury ----

export interface InjuryInput {
  player: number;
  /** Injury type/area; "" when unset. */
  type: string;
  /** "YYYY-MM-DD" */
  startdate: string;
  /** "YYYY-MM-DD" or "" while still injured. */
  returndate: string;
  memo: string;
}

export const injuryApi = {
  /** All injuries for a team (active + past). returndate "" = still injured. */
  list: (teamId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Injury>>("/injury", { team: teamId }, signal)
      .then(items),
  create: (input: InjuryInput) => api.post<CodeResponse>("/injury", input),
  update: (injury: InjuryInput & { id: number }) =>
    api.put<CodeResponse>("/injury", injury),
  remove: (id: number) => api.del<CodeResponse>("/injury", { id }),
};

// ---- Report ----

export const reportApi = {
  /**
   * 경기기록표 xlsx 를 백엔드에서 생성해 Blob 으로 받는다.
   * 집계·서식은 서버가 담당하므로 웹·iOS 가 동일한 파일을 얻는다.
   * start/end 는 "YYYY-MM-DD"(inclusive), 비우면 전체 기간.
   */
  matchRecord: (teamId: number, start?: string, end?: string) =>
    api.getBlob("/report/matchrecord", {
      team: teamId,
      start: start || undefined,
      end: end || undefined,
    }),
};
