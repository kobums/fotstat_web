// Pure helpers for injury-period math.
// Injury dates are "YYYY-MM-DD" and match dates "YYYY-MM-DD HH:mm:ss",
// so comparing the leading 10 chars lexicographically orders them correctly.

import type { Injury, Match } from "../core/api/types";
import { today } from "./date";

/** returndate empty ("") means the player is still injured. */
export function isActiveInjury(injury: Injury): boolean {
  return !(injury.returndate ?? "").trim();
}

function day(date: string | undefined): string {
  return (date ?? "").slice(0, 10);
}

/**
 * Whether a match on `matchdate` falls inside this injury spell.
 * 발생일 당일 경기는 포함하지 않는다(경기 중 부상 = 그날까지는 뛴 것) —
 * 차단·결장 범위는 발생일 다음 날부터 복귀일 당일까지. 백엔드 injuryConflict와 동일 규칙.
 */
export function injuryCoversMatch(injury: Injury, matchdate: string): boolean {
  const start = day(injury.startdate);
  if (!start) return false;
  const d = day(matchdate);
  if (!d || d <= start) return false;
  const end = day(injury.returndate); // "" while still injured
  return end === "" || d <= end;
}

/** Player ids that are injured on the given match date. */
export function injuredPlayerIdsOn(
  injuries: Injury[],
  matchdate: string,
): Set<number> {
  const ids = new Set<number>();
  for (const injury of injuries) {
    if (injuryCoversMatch(injury, matchdate)) ids.add(injury.player);
  }
  return ids;
}

/**
 * How many of `matches` fall inside this single injury spell.
 * 아직 열리지 않은 미래 경기는 "결장"이 아니므로 `until`(기본 오늘)까지만 센다.
 */
export function absentGamesForInjury(
  injury: Injury,
  matches: Match[],
  until: string = today(),
): number {
  return matches.filter(
    (m) => day(m.matchdate) <= until && injuryCoversMatch(injury, m.matchdate),
  ).length;
}

/** How many of `matches` fall inside any injury spell for `playerId`. 미래 경기 제외. */
export function absentGamesFor(
  playerId: number,
  injuries: Injury[],
  matches: Match[],
  until: string = today(),
): number {
  const spells = injuries.filter((i) => i.player === playerId);
  if (spells.length === 0) return 0;
  return matches.filter(
    (m) =>
      day(m.matchdate) <= until &&
      spells.some((i) => injuryCoversMatch(i, m.matchdate)),
  ).length;
}
