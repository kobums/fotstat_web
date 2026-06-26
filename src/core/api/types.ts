// Types mirror the JSON tags returned by the Go backend (fotstat_go/models).
// Foreign keys are plain numeric ids (not nested objects).

export interface User {
  id: number;
  email: string;
  name: string;
  createddate?: string;
  updateddate?: string;
}

export interface Team {
  id: number;
  user: number;
  name: string;
  createddate?: string;
  updateddate?: string;
}

/** Position group used for color coding. Maps a raw position string. */
export type PositionGroup = "gk" | "def" | "mid" | "att";

export interface Player {
  id: number;
  team: number;
  name: string;
  number: number;
  /** Optional date of birth, "YYYY-MM-DD" or "" when unset. */
  birthdate?: string;
  position: string;
  createddate?: string;
  updateddate?: string;
}

export interface Match {
  id: number;
  team: number;
  awayname: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  matchdate: string;
  createddate?: string;
  updateddate?: string;
}

export interface Quarter {
  id: number;
  match: number;
  number: number;
  duration: number;
  awaygoals: number;
  createddate?: string;
  updateddate?: string;
}

/** A player's stat line within a quarter. Named to avoid clashing with the
 *  TypeScript built-in `Record<K, V>` utility type. */
export interface MatchRecord {
  id: number;
  quarter: number;
  player: number;
  min: number;
  goal: number;
  assist: number;
  yellowcard: number;
  redcard: number;
  createddate?: string;
  updateddate?: string;
}

// ---- Response envelopes (controllers.go) ----

export interface AuthResponse {
  code: "ok" | "error";
  token?: string;
  /** Long-lived refresh token; used to renew `token` after it expires. */
  refresh?: string;
  user?: User;
  message?: string;
}

/** List endpoints: { code, items, total? } (total present on page 1). */
export interface ItemsResponse<T> {
  code: "ok" | "error";
  items?: T[];
  total?: number;
  message?: string;
}

/** Single-item endpoints: { code, item }. */
export interface ItemResponse<T> {
  code: "ok" | "error";
  item?: T;
  message?: string;
}

/** Mutations: { code, id?, _t } or { code:"error", message }. */
export interface CodeResponse {
  code: "ok" | "error";
  id?: number;
  message?: string;
}
