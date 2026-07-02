// Pure helpers for injury-period math.
// Injury dates are "YYYY-MM-DD" and match dates "YYYY-MM-DD HH:mm:ss",
// so comparing the leading 10 chars lexicographically orders them correctly.

import type { Injury, Match } from "../core/api/types";

/** returndate empty ("") means the player is still injured. */
export function isActiveInjury(injury: Injury): boolean {
  return !(injury.returndate ?? "").trim();
}

function day(date: string | undefined): string {
  return (date ?? "").slice(0, 10);
}

/** Whether a match on `matchdate` falls inside this injury spell. */
export function injuryCoversMatch(injury: Injury, matchdate: string): boolean {
  const start = day(injury.startdate);
  if (!start) return false;
  const d = day(matchdate);
  if (!d || d < start) return false;
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

/** How many of `matches` fall inside this single injury spell. */
export function absentGamesForInjury(injury: Injury, matches: Match[]): number {
  return matches.filter((m) => injuryCoversMatch(injury, m.matchdate)).length;
}

/** How many of `matches` fall inside any injury spell for `playerId`. */
export function absentGamesFor(
  playerId: number,
  injuries: Injury[],
  matches: Match[],
): number {
  const spells = injuries.filter((i) => i.player === playerId);
  if (spells.length === 0) return 0;
  return matches.filter((m) =>
    spells.some((i) => injuryCoversMatch(i, m.matchdate)),
  ).length;
}
