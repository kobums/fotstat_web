// The backend uses "YYYY-MM-DD HH:mm:ss"; <input type="datetime-local">
// uses "YYYY-MM-DDTHH:mm". These helpers convert between them.

export function parseMatchDate(value: string): Date | null {
  if (!value) return null;
  const normalized = value.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Date -> "YYYY-MM-DD HH:mm:ss" for the API (seconds zeroed). */
export function toApiDate(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:00`
  );
}

/** Like toApiDate but keeps real seconds. Used as the upcoming/past boundary:
 *  match dates are stored with :00 seconds, so a seconds-precise "now" can't
 *  equal any match date and land it in both lists. */
export function toApiDateSeconds(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/** Date -> "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
function dateToInputValue(d: Date): string {
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/** "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm" for datetime-local inputs. */
export function toInputValue(apiDate: string): string {
  const d = parseMatchDate(apiDate);
  return d ? dateToInputValue(d) : "";
}

/** Current local date/time, rounded to the nearest 10 minutes, as
 *  "YYYY-MM-DDTHH:mm" — aligns with the match form's 10-minute step. */
export function nowInputValue(): string {
  const d = new Date();
  d.setMinutes(Math.round(d.getMinutes() / 10) * 10, 0, 0);
  return dateToInputValue(d);
}

/** "YYYY-MM-DDTHH:mm" (input) -> "YYYY-MM-DD HH:mm:ss" (API). */
export function fromInputValue(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "" : toApiDate(d);
}

const FMT = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatMatchDate(apiDate: string): string {
  const d = parseMatchDate(apiDate);
  return d ? FMT.format(d) : apiDate;
}

const TIME_FMT = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "YYYY-MM-DD HH:mm:ss" -> local 24h time only, e.g. "19:00". */
export function formatMatchTime(apiDate: string): string {
  const d = parseMatchDate(apiDate);
  return d ? TIME_FMT.format(d) : apiDate;
}

export function isUpcoming(apiDate: string, now: Date): boolean {
  const d = parseMatchDate(apiDate);
  return d ? d.getTime() >= now.getTime() : false;
}

/** "YYYY-MM-DD HH:mm:ss" -> local "YYYY-MM-DD" (calendar day key). */
export function toDayKey(apiDate: string): string {
  const d = parseMatchDate(apiDate);
  if (!d) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date -> local "YYYY-MM-DD". */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** First day of `d`'s month as "YYYY-MM-01". */
export function monthStartKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}
