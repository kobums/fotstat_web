// Typed endpoint functions grouped by domain.
// List calls unwrap to T[]; single calls to T; mutations return CodeResponse.

import { api } from "./client";
import type {
  Attendance,
  AuthResponse,
  CodeResponse,
  Inbody,
  Injury,
  ItemResponse,
  ItemsResponse,
  Match,
  MatchRecord,
  Player,
  Quarter,
  Team,
  Training,
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

// ---- Inbody ----

/** 측정치는 0 = 미측정(서버가 NULL 저장). testdate만 필수. */
export interface InbodyInput {
  player: number;
  /** "YYYY-MM-DD" */
  testdate: string;
  height: number;
  weight: number;
  muscle: number;
  fat: number;
  rightleg: number;
  leftleg: number;
  score: number;
}

export const inbodyApi = {
  /** 팀 전체 측정 이력 — 선수별 그룹핑·최신값은 클라이언트에서 계산한다. */
  list: (teamId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Inbody>>("/inbody", { team: teamId }, signal)
      .then(items),
  /** (player, testdate)는 UNIQUE — 같은 검사일 재저장은 upsert로 값만 갱신된다. */
  create: (input: InbodyInput) => api.post<CodeResponse>("/inbody", input),
  update: (inbody: InbodyInput & { id: number }) =>
    api.put<CodeResponse>("/inbody", inbody),
  remove: (id: number) => api.del<CodeResponse>("/inbody", { id }),
  /** 시트 일괄 입력 — 행 단위 upsert. */
  createBatch: (inputs: InbodyInput[]) =>
    api.post<CodeResponse>("/inbody/batch", inputs),
};

// ---- Training ----

export interface TrainingInput {
  team: number;
  /** "YYYY-MM-DD HH:mm:ss" */
  trainingdate: string;
}

export const trainingApi = {
  list: (teamId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Training>>("/training", { team: teamId }, signal)
      .then(items),
  create: (input: TrainingInput) => api.post<CodeResponse>("/training", input),
  update: (training: TrainingInput & { id: number }) =>
    api.put<CodeResponse>("/training", training),
  remove: (id: number) => api.del<CodeResponse>("/training", { id }),
};

// ---- Attendance ----

export interface AttendanceInput {
  training: number;
  player: number;
  /** 선수별 훈련 시간(분). */
  min: number;
}

export const attendanceApi = {
  /** 팀 전체 참석 — 세션별 그룹핑·선수별 집계는 클라이언트에서 한다. */
  listByTeam: (teamId: number, signal?: AbortSignal) =>
    api
      .get<ItemsResponse<Attendance>>("/attendance", { team: teamId }, signal)
      .then(items),
  /** (training, player)는 UNIQUE — 서버가 upsert 하므로 재전송 시 min만 갱신된다. */
  createBatch: (inputs: AttendanceInput[]) =>
    api.post<CodeResponse>("/attendance/batch", inputs),
  removeBatch: (ids: number[]) =>
    api.del<CodeResponse>(
      "/attendance/batch",
      ids.map((id) => ({ id })),
    ),
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
