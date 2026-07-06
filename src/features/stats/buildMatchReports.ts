import type { Match, MatchRecord, Quarter } from "../../core/api/types";
import { parseMatchDate } from "../../lib/date";

export interface QuarterLine {
  id: number;
  number: number;
  home: number;
  away: number;
  duration: number;
}

export interface MatchReport {
  match: Match;
  home: number;
  away: number;
  quarters: QuarterLine[];
}

// 리포트 화면의 경기별 쿼터 결과. 홈 득점 = 쿼터별 record.goal 합,
// 원정 득점 = quarter.awaygoals — aggregateTeamStats와 동일한 규칙.
// 쿼터가 없는(미진행) 경기는 제외하고 최신순으로 정렬한다.
export function buildMatchReports(
  matches: Match[],
  quarters: Quarter[],
  records: MatchRecord[],
): MatchReport[] {
  const goalsByQuarter = new Map<number, number>();
  records.forEach((r) => {
    goalsByQuarter.set(r.quarter, (goalsByQuarter.get(r.quarter) ?? 0) + r.goal);
  });

  const byMatch = new Map<number, QuarterLine[]>();
  quarters.forEach((q) => {
    const line: QuarterLine = {
      id: q.id,
      number: q.number,
      home: goalsByQuarter.get(q.id) ?? 0,
      away: q.awaygoals,
      duration: q.duration,
    };
    const entry = byMatch.get(q.match) ?? [];
    entry.push(line);
    byMatch.set(q.match, entry);
  });

  return matches
    .filter((m) => byMatch.has(m.id))
    .sort(
      (a, b) =>
        (parseMatchDate(b.matchdate)?.getTime() ?? 0) -
        (parseMatchDate(a.matchdate)?.getTime() ?? 0),
    )
    .map((m) => {
      const lines = [...(byMatch.get(m.id) ?? [])].sort(
        (a, b) => a.number - b.number,
      );
      return {
        match: m,
        home: lines.reduce((s, q) => s + q.home, 0),
        away: lines.reduce((s, q) => s + q.away, 0),
        quarters: lines,
      };
    });
}
