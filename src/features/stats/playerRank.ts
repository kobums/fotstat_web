// 선수 상세의 "팀 내 위치" — fotmob 시즌 성적 카드의 순위 바를 팀 단위로 옮긴 것.
// 지표별로 선수 값·팀 평균·상위 %·순위를 만든다. 순수 함수라 단위 테스트 가능.

import type { PlayerTrainingStats } from "../../lib/training";
import { topPercent } from "../../lib/percentile";
import type { PlayerStat } from "./aggregateTeamStats";

/** 합계 / 경기당 토글 (fotmob "합계 | 90분당"의 팀 기록 버전 — 쿼터 길이가
 *  팀마다 달라 90분 환산 대신 경기당으로 둔다). */
export type RankMode = "total" | "perGame";

export interface RankMetric {
  key: string;
  label: string;
  /** 선수 값 (mode 반영). */
  value: number;
  /** 팀 평균 — 출전 기록이 있는 선수들만의 평균(squadAverages와 같은 기준선). */
  avg: number;
  /** 스쿼드 전원 기준 상위 X% (동률은 같은 퍼센타일). */
  pct: number;
  /** 1위부터의 순위 — 동률은 같은 순위(1224 방식). */
  rank: number;
  /** 순위 모집단 크기(스쿼드 인원). */
  total: number;
  /** 비례 바 기준값 — 스쿼드 1위 값(0이면 1). */
  max: number;
  unit: string;
  decimals: number;
}

/** 1224 방식 순위: 나보다 큰 값의 수 + 1. 빈 모집단이면 1/0. */
export function teamRank(value: number, all: number[]): { rank: number; total: number } {
  const better = all.filter((v) => v > value).length;
  return { rank: better + 1, total: all.length };
}

/** 스쿼드가 작으면 "상위 N%"가 무의미해 순위로 바꿔 표기한다. */
export const PCT_MIN_SQUAD = 5;

export function rankLabel(m: RankMetric): string {
  if (m.total === 0) return "-";
  return m.total >= PCT_MIN_SQUAD ? `상위 ${m.pct}%` : `${m.rank}위 / ${m.total}명`;
}

function perGame(value: number, games: number): number {
  return games > 0 ? value / games : 0;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
}

interface MetricDef {
  key: string;
  label: string;
  pick: (p: PlayerStat) => number;
  unit?: string;
}

const STAT_METRICS: MetricDef[] = [
  { key: "goal", label: "골", pick: (p) => p.goal },
  { key: "assist", label: "도움", pick: (p) => p.assist },
  { key: "points", label: "공격P", pick: (p) => p.goal + p.assist },
  { key: "min", label: "출전 시간", pick: (p) => p.min, unit: "′" },
];

/**
 * 선수의 팀 내 위치 지표 목록.
 * - 순위·상위%는 스쿼드 전원 기준(PlayerStatDetail의 topPercent와 동일 모집단).
 * - 팀 평균은 출전 기록이 있는 선수만(0경기 선수가 평균을 끌어내리지 않게).
 * - `training`이 주어지면 참석률(%) 지표를 덧붙인다 — 모드와 무관하게 항상 %.
 *   참석률 평균만은 스쿼드 전원 기준: 0%(전 결석)도 유효한 값이라 출전 여부와 무관하다.
 */
export function playerRankMetrics(
  playerId: number,
  players: PlayerStat[],
  mode: RankMode,
  training?: Map<number, PlayerTrainingStats>,
): RankMetric[] {
  const me = players.find((p) => p.id === playerId);
  if (!me) return [];
  const played = players.filter((p) => p.games > 0);
  const decimals = mode === "perGame" ? 2 : 0;

  const metrics: RankMetric[] = STAT_METRICS.map((def) => {
    const valueOf = (p: PlayerStat) =>
      mode === "perGame" ? perGame(def.pick(p), p.games) : def.pick(p);
    const all = players.map(valueOf);
    const value = valueOf(me);
    const { rank, total } = teamRank(value, all);
    return {
      key: def.key,
      label: def.label,
      value,
      avg: mean(played.map(valueOf)),
      pct: topPercent(value, all),
      rank,
      total,
      max: Math.max(...all, 0) || 1,
      unit: def.unit ?? "",
      decimals,
    };
  });

  if (training) {
    const rateOf = (p: PlayerStat) => training.get(p.id)?.rate ?? 0;
    const all = players.map(rateOf);
    const value = rateOf(me);
    const { rank, total } = teamRank(value, all);
    metrics.push({
      key: "attendance",
      label: "훈련 참석률",
      value,
      avg: mean(all),
      pct: topPercent(value, all),
      rank,
      total,
      max: 100,
      unit: "%",
      decimals: 0,
    });
  }

  return metrics;
}
