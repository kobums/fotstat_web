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
  /** 쿼터 기본 시간(분) — 쿼터 추가 시 프리필. 구서버 응답엔 없음 */
  duration?: number;
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

/** A player's injury spell. `returndate` empty ("") means still injured. */
export interface Injury {
  id: number;
  player: number;
  /** Injury type/area, e.g. "발목 염좌". "" when unset. */
  type?: string;
  /** "YYYY-MM-DD" */
  startdate?: string;
  /** "YYYY-MM-DD" or "" while still injured. */
  returndate?: string;
  memo?: string;
  createddate?: string;
  updateddate?: string;
}

/** A training session. 입력 필드는 일시 하나뿐 (의도적 최소 설계). */
export interface Training {
  id: number;
  team: number;
  /** "YYYY-MM-DD HH:mm:ss" */
  trainingdate: string;
  createddate?: string;
  updateddate?: string;
}

/** 훈련 참석 — 행 존재 = 참석, 체크 해제 = 행 삭제. */
export interface Attendance {
  id: number;
  training: number;
  player: number;
  /** 선수별 훈련 시간(분). */
  min: number;
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
