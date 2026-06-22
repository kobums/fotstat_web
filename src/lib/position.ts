import type { PositionGroup } from "../core/api/types";

/** Selectable positions, grouped by line (for the player form). */
export const POSITION_OPTIONS: { group: string; values: string[] }[] = [
  { group: "골키퍼", values: ["GK"] },
  { group: "수비", values: ["CB", "LB", "RB", "LWB", "RWB"] },
  { group: "미드필더", values: ["CDM", "CM", "CAM", "LM", "RM"] },
  { group: "공격", values: ["LW", "RW", "ST", "CF"] },
];

const DEF = new Set(["CB", "LB", "RB", "LWB", "RWB", "SW"]);
const MID = new Set(["CDM", "CM", "CAM", "LM", "RM", "DM", "AM"]);
const ATT = new Set(["LW", "RW", "ST", "CF", "SS"]);

/** Map a raw position string (e.g. "ST", "CDM") to its color group. */
export function positionGroup(position: string): PositionGroup {
  const p = position.trim().toUpperCase();
  if (p === "GK") return "gk";
  if (DEF.has(p)) return "def";
  if (MID.has(p)) return "mid";
  if (ATT.has(p)) return "att";
  return "mid";
}

/** CSS variable holding the color for a position group. */
export function positionColorVar(position: string): string {
  return `var(--role-${positionGroup(position)})`;
}

/** Display order + label for squad grouping by line. */
export const POSITION_GROUPS: { key: PositionGroup; label: string }[] = [
  { key: "gk", label: "골키퍼" },
  { key: "def", label: "수비수" },
  { key: "mid", label: "미드필더" },
  { key: "att", label: "공격수" },
];
