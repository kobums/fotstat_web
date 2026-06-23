// Pure validation for the player form, extracted so every branch (empty,
// zero, negative, non-integer, out-of-range) is unit-testable without fighting
// the quirks of a controlled <input type="number">.

export type PlayerFormResult =
  | { ok: true; value: { name: string; number: number } }
  | { ok: false; error: string };

/** Jersey numbers are 1–99 (no 0, no negatives, max two digits). */
export const MIN_NUMBER = 1;
export const MAX_NUMBER = 99;

/**
 * Validate the raw player-form fields.
 * @param name raw name input (trimmed here)
 * @param jerseyNumber raw jersey-number input as a string
 */
export function validatePlayerForm(
  name: string,
  jerseyNumber: string,
): PlayerFormResult {
  const trimmedName = name.trim();
  if (!trimmedName) return { ok: false, error: "선수 이름을 입력해주세요." };

  // Number("") and Number("  ") are both 0, so guard the empty case explicitly
  // before the range check rather than letting it read as "0".
  const raw = jerseyNumber.trim();
  if (raw === "") {
    return { ok: false, error: "등번호를 입력해주세요." };
  }
  // Require plain digits: this rejects "-1", "7.5", and exponent forms like
  // "1e1" (which Number() would otherwise coerce to 10).
  const num = Number(raw);
  if (!/^\d+$/.test(raw) || num < MIN_NUMBER || num > MAX_NUMBER) {
    return { ok: false, error: "등번호는 1~99 사이로 입력해주세요." };
  }

  return { ok: true, value: { name: trimmedName, number: num } };
}
