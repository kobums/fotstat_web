// Small pure helpers for rolling up record stats. The `records.reduce((s, r)
// => s + r.goal, 0)` / `+ r.assist` idiom appeared across QuarterSection,
// RecordFormModal and MatchDetailPage; these give it one name.

export function sumGoals(records: readonly { goal: number }[]): number {
  return records.reduce((s, r) => s + r.goal, 0);
}

export function sumAssists(records: readonly { assist: number }[]): number {
  return records.reduce((s, r) => s + r.assist, 0);
}
