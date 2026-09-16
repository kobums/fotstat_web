import type { Match, MatchRecord, Quarter } from "../../core/api/types";

// 선수 상세의 "경기별 기록" — 선수가 뛴 경기마다 쿼터별(출전분/골/도움/카드)과
// 경기 합계, 그리고 경기 스코어(팀:상대)를 만든다. 순수 함수라 단위 테스트 가능.

export interface QuarterLine {
  quarterId: number;
  number: number;
  min: number;
  goal: number;
  assist: number;
  yellow: number;
  red: number;
}

export interface PlayerMatchLog {
  matchId: number;
  opponent: string;
  /** "YYYY-MM-DD HH:mm:ss" */
  matchdate: string;
  /** 우리 팀 득점(경기 내 전 선수 record.goal 합). */
  home: number;
  /** 상대 득점(쿼터 awaygoals 합). */
  away: number;
  quarters: QuarterLine[];
  // 이 경기에서 선수의 합계
  min: number;
  goal: number;
  assist: number;
  yellow: number;
  red: number;
}

export function playerMatchLogs(
  playerId: number,
  matches: Match[],
  quarters: Quarter[],
  records: MatchRecord[],
): PlayerMatchLog[] {
  const matchById = new Map(matches.map((m) => [m.id, m]));
  const quarterById = new Map(quarters.map((q) => [q.id, q]));

  // 경기별 스코어: 상대(awaygoals 합) / 우리팀(전 선수 record.goal 합)
  const awayByMatch = new Map<number, number>();
  quarters.forEach((q) =>
    awayByMatch.set(q.match, (awayByMatch.get(q.match) ?? 0) + q.awaygoals),
  );
  const homeByMatch = new Map<number, number>();
  records.forEach((r) => {
    const q = quarterById.get(r.quarter);
    if (!q) return;
    homeByMatch.set(q.match, (homeByMatch.get(q.match) ?? 0) + r.goal);
  });

  // 선수의 기록을 경기별로 묶어 쿼터 라인 구성
  const linesByMatch = new Map<number, QuarterLine[]>();
  records.forEach((r) => {
    if (r.player !== playerId) return;
    const q = quarterById.get(r.quarter);
    if (!q) return;
    const arr = linesByMatch.get(q.match) ?? [];
    arr.push({
      quarterId: q.id,
      number: q.number,
      min: r.min,
      goal: r.goal,
      assist: r.assist,
      yellow: r.yellowcard,
      red: r.redcard,
    });
    linesByMatch.set(q.match, arr);
  });

  const logs: PlayerMatchLog[] = [];
  linesByMatch.forEach((lines, matchId) => {
    const m = matchById.get(matchId);
    if (!m) return;
    lines.sort((a, b) => a.number - b.number);
    const tot = lines.reduce(
      (acc, l) => {
        acc.min += l.min;
        acc.goal += l.goal;
        acc.assist += l.assist;
        acc.yellow += l.yellow;
        acc.red += l.red;
        return acc;
      },
      { min: 0, goal: 0, assist: 0, yellow: 0, red: 0 },
    );
    logs.push({
      matchId,
      opponent: m.awayname,
      matchdate: m.matchdate,
      home: homeByMatch.get(matchId) ?? 0,
      away: awayByMatch.get(matchId) ?? 0,
      quarters: lines,
      ...tot,
    });
  });

  // 최신 경기 순 (matchdate 문자열 내림차순)
  logs.sort((a, b) =>
    a.matchdate < b.matchdate ? 1 : a.matchdate > b.matchdate ? -1 : 0,
  );
  return logs;
}

/** 카드 표기: 0이면 빈칸, 1이면 아이콘만, 2+면 아이콘+개수. */
export function cardText(yellow: number, red: number): string {
  const parts: string[] = [];
  if (yellow > 0) parts.push(yellow > 1 ? `🟨${yellow}` : "🟨");
  if (red > 0) parts.push(red > 1 ? `🟥${red}` : "🟥");
  return parts.join(" ");
}
