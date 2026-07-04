// 어시스트 무결성 규칙 (iOS RecordViewModel.assistCap 미러):
//   ① 자기 골에는 어시스트 불가 → 개인 assist ≤ 남의 골 합
//   ② 팀 assist 합 ≤ 팀 goal 합 → 개인 assist ≤ 팀 골 합 − 남의 assist 합
// cap = max(0, min(othersGoals, totalGoals − othersAssists)),
//   totalGoals = othersGoals + ownGoals

export interface AssistCapInput {
  /** 같은 쿼터에서 다른 선수들이 넣은 골 합. */
  othersGoals: number;
  /** 같은 쿼터에서 다른 선수들이 기록한 어시스트 합. */
  othersAssists: number;
  /** 이 선수의 (입력 중인) 골 수. */
  ownGoals: number;
}

/** 이 선수가 가질 수 있는 최대 어시스트. */
export function assistCap({
  othersGoals,
  othersAssists,
  ownGoals,
}: AssistCapInput): number {
  return Math.max(0, Math.min(othersGoals, othersGoals + ownGoals - othersAssists));
}

/** 골 수가 바뀐 뒤 현재 어시스트 값을 캡 안으로 되돌린다. */
export function clampAssist(assist: number, input: AssistCapInput): number {
  return Math.max(0, Math.min(assist, assistCap(input)));
}

export interface QuarterEntry {
  /** record id */
  id: number;
  player: number;
  goal: number;
  assist: number;
}

/**
 * 골 변경/기록 삭제로 무너진 어시스트 불변식을 복구하기 위해 조정해야 할
 * 기록 목록을 돌려준다 (iOS RecordViewModel.rebalanceAssists 미러):
 *   1) 각 선수의 assist ≤ 팀 골 합 − 본인 골 (자기 골 어시 불가)
 *   2) 남은 초과분(팀 assist 합 − 팀 goal 합)은 목록 아래쪽부터 차감
 * lockedPlayerIds(부상 등 수정 불가 선수)의 기록은 건드리지 않는다.
 */
export function rebalanceAssists(
  entries: QuarterEntry[],
  lockedPlayerIds?: Set<number>,
): Array<{ id: number; assist: number }> {
  const totalGoals = entries.reduce((s, e) => s + e.goal, 0);
  const next = entries.map((e) => ({ ...e }));
  const changed = new Set<number>();

  for (const e of next) {
    if (lockedPlayerIds?.has(e.player)) continue;
    const cap = Math.max(0, totalGoals - e.goal);
    if (e.assist > cap) {
      e.assist = cap;
      changed.add(e.id);
    }
  }

  let excess = next.reduce((s, e) => s + e.assist, 0) - totalGoals;
  for (let i = next.length - 1; i >= 0 && excess > 0; i--) {
    const e = next[i];
    if (lockedPlayerIds?.has(e.player) || e.assist <= 0) continue;
    const cut = Math.min(e.assist, excess);
    e.assist -= cut;
    excess -= cut;
    changed.add(e.id);
  }

  return next
    .filter((e) => changed.has(e.id))
    .map((e) => ({ id: e.id, assist: e.assist }));
}
