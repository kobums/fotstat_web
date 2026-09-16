import { describe, expect, it } from "vitest";
import type { Match, MatchRecord, Quarter } from "../../core/api/types";
import { cardText, playerMatchLogs } from "./playerMatchLog";

const matches: Match[] = [
  { id: 1, team: 1, awayname: "A팀", matchdate: "2026-06-01 10:00:00" },
  { id: 2, team: 1, awayname: "B팀", matchdate: "2026-06-08 10:00:00" },
];

// 경기1: Q1,Q2 / 경기2: Q3
const quarters: Quarter[] = [
  { id: 11, match: 1, number: 1, duration: 15, awaygoals: 1 },
  { id: 12, match: 1, number: 2, duration: 15, awaygoals: 0 },
  { id: 21, match: 2, number: 1, duration: 20, awaygoals: 2 },
];

const rec = (
  id: number,
  quarter: number,
  player: number,
  min: number,
  goal: number,
  assist: number,
  yellow = 0,
  red = 0,
): MatchRecord => ({
  id,
  quarter,
  player,
  min,
  goal,
  assist,
  yellowcard: yellow,
  redcard: red,
});

const records: MatchRecord[] = [
  // 선수 100
  rec(1, 11, 100, 15, 1, 1, 1, 0),
  rec(2, 12, 100, 15, 1, 0),
  rec(3, 21, 100, 20, 0, 1, 0, 1),
  // 다른 선수 200 (경기1 득점 → 홈 스코어에 반영)
  rec(4, 11, 200, 15, 2, 0),
];

describe("playerMatchLogs", () => {
  it("선수가 뛴 경기만, 최신순으로, 쿼터 라인·합계·스코어를 만든다", () => {
    const logs = playerMatchLogs(100, matches, quarters, records);
    expect(logs.map((l) => l.matchId)).toEqual([2, 1]); // 최신(6/8)이 먼저

    const m1 = logs.find((l) => l.matchId === 1)!;
    expect(m1.opponent).toBe("A팀");
    // 홈 = 경기1 전 선수 골 합(1+1+2=4), 원정 = awaygoals 합(1+0=1)
    expect(m1.home).toBe(4);
    expect(m1.away).toBe(1);
    // 쿼터 라인 2개, 번호순
    expect(m1.quarters.map((q) => q.number)).toEqual([1, 2]);
    // 선수 합계: 30분, 2골, 1도움, 옐로1
    expect(m1.min).toBe(30);
    expect(m1.goal).toBe(2);
    expect(m1.assist).toBe(1);
    expect(m1.yellow).toBe(1);
    expect(m1.red).toBe(0);

    const m2 = logs.find((l) => l.matchId === 2)!;
    expect(m2.away).toBe(2);
    expect(m2.red).toBe(1);
  });

  it("기록이 없는 선수는 빈 배열", () => {
    expect(playerMatchLogs(999, matches, quarters, records)).toEqual([]);
  });
});

describe("cardText", () => {
  it("0은 빈칸, 1은 아이콘, 2+는 아이콘+개수", () => {
    expect(cardText(0, 0)).toBe("");
    expect(cardText(1, 0)).toBe("🟨");
    expect(cardText(2, 1)).toBe("🟨2 🟥");
  });
});
