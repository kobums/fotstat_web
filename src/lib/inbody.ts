// Pure helpers for InBody measurement math.
// 측정치는 서버가 NULL을 0으로 내려주므로 0 = 미측정으로 취급한다.
// testdate는 "YYYY-MM-DD" 고정폭이라 문자열 비교로 대소를 판단한다 (lib/injury.ts와 동일 관례).

import type { Inbody } from "../core/api/types";

/** 검사일 내림차순 비교자 — 최근 측정이 먼저. */
export function byTestdateDesc(a: Inbody, b: Inbody): number {
  return (b.testdate ?? "").localeCompare(a.testdate ?? "");
}

/** 선수의 측정 이력만 최근순으로. */
export function playerInbodiesSorted(entries: Inbody[], playerId: number): Inbody[] {
  return entries.filter((e) => e.player === playerId).sort(byTestdateDesc);
}

/** 추이 지표 키 — 라인 차트 대상. */
export type InbodyMetric = "weight" | "fat" | "muscle";

export const INBODY_METRICS: { key: InbodyMetric; label: string; unit: string }[] = [
  { key: "weight", label: "체중", unit: "kg" },
  { key: "fat", label: "체지방률", unit: "%" },
  { key: "muscle", label: "골격근량", unit: "kg" },
];

export interface ChartPoint {
  date: string;
  value: number;
}

/** 지표별 차트 시리즈 — 값이 있는(>0) 측정만, 검사일 오름차순. */
export function chartSeries(entries: Inbody[], metric: InbodyMetric): ChartPoint[] {
  return entries
    .filter((e) => e[metric] > 0)
    .sort((a, b) => (a.testdate ?? "").localeCompare(b.testdate ?? ""))
    .map((e) => ({ date: e.testdate, value: e[metric] }));
}

/** 시트 입력 한 행의 문자열 값 묶음 (검사일 제외). */
export interface InbodyRowDraft {
  height: string;
  weight: string;
  muscle: string;
  fat: string;
  rightleg: string;
  leftleg: string;
  score: string;
}

export const EMPTY_ROW: InbodyRowDraft = {
  height: "",
  weight: "",
  muscle: "",
  fat: "",
  rightleg: "",
  leftleg: "",
  score: "",
};

/** 기존 측정으로 시트 행을 프리필 — 0(미측정)은 빈칸으로. */
export function rowFromInbody(e: Inbody): InbodyRowDraft {
  const s = (v: number) => (v > 0 ? String(v) : "");
  return {
    height: s(e.height),
    weight: s(e.weight),
    muscle: s(e.muscle),
    fat: s(e.fat),
    rightleg: s(e.rightleg),
    leftleg: s(e.leftleg),
    score: s(e.score),
  };
}

/** 값이 하나라도 입력된 행인가 — 시트 저장 시 이 행만 전송한다. */
export function rowHasValue(row: InbodyRowDraft): boolean {
  return Object.values(row).some((v) => v.trim() !== "");
}

/** 행 문자열 → 숫자. 빈값은 0(미측정), 비수치·음수는 null(검증 실패). */
export function parseRowValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** 시트 행 → InbodyInput 값 부분. 검증 실패 필드가 있으면 null. */
export function parseInbodyRow(
  row: InbodyRowDraft,
): Omit<InbodyRowParsed, "player" | "testdate"> | null {
  const height = parseRowValue(row.height);
  const weight = parseRowValue(row.weight);
  const muscle = parseRowValue(row.muscle);
  const fat = parseRowValue(row.fat);
  const rightleg = parseRowValue(row.rightleg);
  const leftleg = parseRowValue(row.leftleg);
  const score = parseRowValue(row.score);
  if (
    height === null || weight === null || muscle === null || fat === null ||
    rightleg === null || leftleg === null || score === null
  ) {
    return null;
  }
  return { height, weight, muscle, fat, rightleg, leftleg, score };
}

export interface InbodyRowParsed {
  player: number;
  testdate: string;
  height: number;
  weight: number;
  muscle: number;
  fat: number;
  rightleg: number;
  leftleg: number;
  score: number;
}
