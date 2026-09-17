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

/** 선수 인바디(체성분) 측정 1건. 검사일 외 측정치는 전부 선택 —
 *  서버가 NULL을 0으로 내려주므로 0 = 미측정으로 취급한다. */
export interface Inbody {
  id: number;
  player: number;
  /** "YYYY-MM-DD" */
  testdate: string;
  /** 신장(cm). 0 = 미측정 */
  height: number;
  /** 체중(kg). 0 = 미측정 */
  weight: number;
  /** 골격근량(kg). 0 = 미측정 */
  muscle: number;
  /** 체지방률(%). 0 = 미측정 */
  fat: number;
  /** 오른다리 근육량(kg). 0 = 미측정 */
  rightleg: number;
  /** 왼다리 근육량(kg). 0 = 미측정 */
  leftleg: number;
  /** 인바디 점수. 0 = 미측정 */
  score: number;
  createddate?: string;
  updateddate?: string;
}

// ---- Response envelopes (controllers.go) ----

// ---- 선수 상세 통계 (GET /player/:id/stats) ----
// 서버 controllers/rest/playerstats.go 의 응답. 필드 이름은 클라이언트 집계 타입
// (features/stats PlayerStat · PlayerMatchLog · lib/training PlayerTrainingStats)과 맞춰
// 화면 컴포넌트가 그대로 소비한다.

export interface PlayerTrainingLine {
  attended: number;
  held: number;
  rate: number;
  totalMin: number;
}

export interface PlayerStatsLine {
  id: number;
  name: string;
  number: number;
  position: string;
  games: number;
  min: number;
  goal: number;
  assist: number;
  yellow: number;
  red: number;
  absentGames: number;
  /** 기간 내 열린 훈련이 없으면 null. */
  training: PlayerTrainingLine | null;
}

export interface PlayerStatsQuarterLine {
  quarterId: number;
  number: number;
  min: number;
  goal: number;
  assist: number;
  yellow: number;
  red: number;
}

export interface PlayerStatsMatchLine {
  matchId: number;
  opponent: string;
  matchdate: string;
  home: number;
  away: number;
  quarters: PlayerStatsQuarterLine[];
  min: number;
  goal: number;
  assist: number;
  yellow: number;
  red: number;
}

export interface PlayerStatsResult {
  player: Player;
  start: string;
  end: string;
  /** 기간 내 진행된(쿼터가 있는) 팀 경기 수. */
  matchCount: number;
  summary: PlayerStatsLine;
  /** 스쿼드 전원(순위·팀 평균 계산용), 등번호→이름 순. */
  squad: PlayerStatsLine[];
  /** 최신 경기 순. */
  matches: PlayerStatsMatchLine[];
  /** 기간과 무관한 전체 이력, 최신 발생순. */
  injuries: Injury[];
}

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
