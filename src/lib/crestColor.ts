// Team crest background colors (ported from iOS FSCrest palette).
const PALETTE = [
  "#1B5E20",
  "#0D47A1",
  "#4A148C",
  "#B71C1C",
  "#37474F",
  "#3E2723",
  "#01579B",
  "#5D4037",
  "#1A237E",
];

/** Deterministic color from a team name (stable across renders/sessions). */
export function crestColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/** Up to two-character initials for a crest. */
export function initials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
