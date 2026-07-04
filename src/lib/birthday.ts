// Pure helpers for player-birthday calendar math.
// Birthdates are "YYYY-MM-DD" (or "" / undefined when unset); calendar day
// keys are local "YYYY-MM-DD". Birthdays recur yearly by exact month/day
// match, so a 02-29 birthdate only lands on leap-year Feb 29 cells.

import type { Player } from "../core/api/types";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** "YYYY-MM-DD" -> recurring "MM-DD" key, or "" for blank/invalid input. */
export function monthDayKey(date: string | undefined): string {
  const m = DATE_RE.exec(date ?? "");
  return m ? `${m[2]}-${m[3]}` : "";
}

/** Whether `dayKey` ("YYYY-MM-DD") is this birthdate's day in any year. */
export function isBirthdayOn(
  birthdate: string | undefined,
  dayKey: string,
): boolean {
  const bday = monthDayKey(birthdate);
  return bday !== "" && bday === monthDayKey(dayKey);
}

/** Recurring "MM-DD" keys for every squad player with a birthdate. */
export function birthdayMonthDays(players: Player[]): Set<string> {
  const days = new Set<string>();
  for (const p of players) {
    const key = monthDayKey(p.birthdate);
    if (key) days.add(key);
  }
  return days;
}

/** Players whose birthday falls on `dayKey` ("YYYY-MM-DD"), in input order. */
export function birthdayPlayersOn(
  players: Player[],
  dayKey: string,
): Player[] {
  return players.filter((p) => isBirthdayOn(p.birthdate, dayKey));
}

/** Age turned on `dayKey` for a birthdate whose birthday it is (calendar-year
 *  difference). null when either date is invalid or the result is negative. */
export function birthdayAgeOn(
  birthdate: string | undefined,
  dayKey: string,
): number | null {
  const b = DATE_RE.exec(birthdate ?? "");
  const d = DATE_RE.exec(dayKey);
  if (!b || !d) return null;
  const age = Number(d[1]) - Number(b[1]);
  return age >= 0 && age < 150 ? age : null;
}
