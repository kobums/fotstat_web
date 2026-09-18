import { describe, expect, it } from "vitest";
import type { PlayerTrainingStats } from "../../lib/training";
import type { PlayerStat } from "./aggregateTeamStats";
import { playerRankMetrics, rankLabel, teamRank } from "./playerRank";

const stat = (p: Partial<PlayerStat> & Pick<PlayerStat, "id">): PlayerStat => ({
  name: `P${p.id}`,
  number: p.id,
  position: "CM",
  games: 0,
  min: 0,
  goal: 0,
  assist: 0,
  yellow: 0,
  red: 0,
  absentGames: 0,
  ...p,
});

const squad: PlayerStat[] = [
  stat({ id: 1, games: 4, goal: 4, assist: 2, min: 200 }),
  stat({ id: 2, games: 2, goal: 3, assist: 0, min: 100 }),
  stat({ id: 3, games: 4, goal: 0, assist: 4, min: 240 }),
  stat({ id: 4 }), // 출전 없음
];

describe("teamRank", () => {
  it("나보다 큰 값의 수 + 1, 동률은 같은 순위", () => {
    expect(teamRank(3, [5, 3, 3, 1])).toEqual({ rank: 2, total: 4 });
    expect(teamRank(5, [5, 3, 3, 1])).toEqual({ rank: 1, total: 4 });
    expect(teamRank(0, [])).toEqual({ rank: 1, total: 0 });
  });
});

describe("playerRankMetrics", () => {
  it("합계 모드 — 값·순위·1위 기준 max", () => {
    const m = playerRankMetrics(2, squad, "total");
    const goal = m.find((x) => x.key === "goal")!;
    expect(goal.value).toBe(3);
    expect(goal.rank).toBe(2);
    expect(goal.total).toBe(4);
    expect(goal.max).toBe(4);
    expect(goal.decimals).toBe(0);
    // 팀 평균은 출전 선수(1,2,3)만: (4+3+0)/3
    expect(goal.avg).toBeCloseTo(7 / 3);
  });

  it("경기당 모드 — 경기 수가 적어도 평균이 높으면 앞선다", () => {
    const m = playerRankMetrics(2, squad, "perGame");
    const goal = m.find((x) => x.key === "goal")!;
    expect(goal.value).toBeCloseTo(1.5);
    expect(goal.rank).toBe(1); // 1.5 > 1.0(선수1)
    expect(goal.decimals).toBe(2);
    const zero = playerRankMetrics(4, squad, "perGame").find((x) => x.key === "min")!;
    expect(zero.value).toBe(0);
    expect(zero.rank).toBe(4);
  });

  it("경기당 출전 시간은 정수 분으로 표시한다(다른 지표는 소수 둘째 자리)", () => {
    const m = playerRankMetrics(1, squad, "perGame");
    expect(m.find((x) => x.key === "min")!.decimals).toBe(0);
    expect(m.find((x) => x.key === "points")!.decimals).toBe(2);
  });

  it("훈련 통계가 있으면 참석률 지표를 덧붙인다", () => {
    const training = new Map<number, PlayerTrainingStats>([
      [1, { attended: 8, held: 10, rate: 80, totalMin: 480 }],
      [2, { attended: 5, held: 10, rate: 50, totalMin: 300 }],
    ]);
    const m = playerRankMetrics(2, squad, "total", training);
    const att = m.find((x) => x.key === "attendance")!;
    expect(att.value).toBe(50);
    expect(att.rank).toBe(2);
    expect(att.max).toBe(100);
    expect(att.avg).toBeCloseTo((80 + 50) / 4);
    expect(playerRankMetrics(2, squad, "total").some((x) => x.key === "attendance")).toBe(false);
  });

  it("없는 선수는 빈 배열", () => {
    expect(playerRankMetrics(99, squad, "total")).toEqual([]);
  });
});

describe("rankLabel", () => {
  const base = { key: "goal", label: "골", value: 1, avg: 1, max: 1, unit: "", decimals: 0 };
  it("5명 이상이면 상위 %, 미만이면 순위", () => {
    expect(rankLabel({ ...base, pct: 20, rank: 1, total: 5 })).toBe("상위 20%");
    expect(rankLabel({ ...base, pct: 25, rank: 1, total: 4 })).toBe("1위 / 4명");
    expect(rankLabel({ ...base, pct: 100, rank: 1, total: 0 })).toBe("-");
  });
  it("값이 0이면 순위를 매기지 않는다 — 전원 0일 때의 공동 1위 배지 방지", () => {
    expect(rankLabel({ ...base, value: 0, pct: 5, rank: 1, total: 21 })).toBe("-");
    expect(rankLabel({ ...base, value: 0, pct: 34, rank: 1, total: 3 })).toBe("-");
  });
});
