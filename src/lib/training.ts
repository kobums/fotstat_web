// Pure helpers for training/attendance math.
// Training dates are "YYYY-MM-DD HH:mm:ss" so the leading 10 chars compare
// lexicographically — same convention as lib/injury.ts.

import type { Attendance, Injury, Training } from "../core/api/types";
import { dayOf, today } from "./date";
import { injuryCoversMatch } from "./injury";

/** 훈련 일시 내림차순 비교자 — 최근 훈련이 먼저. */
export function byTrainingdateDesc(a: Training, b: Training): number {
  return (b.trainingdate ?? "").localeCompare(a.trainingdate ?? "");
}

/** 이미 열린(오늘 포함 과거) 훈련만 — 참석률 분모. 미래 훈련은 아직 결석이 아니다. */
export function heldTrainings(
  trainings: Training[],
  until: string = today(),
): Training[] {
  return trainings.filter((t) => dayOf(t.trainingdate) <= until);
}

/** training id -> 참석 목록. 세션 행의 "참석 n명" 표시용. */
export function attendancesByTraining(
  attendances: Attendance[],
): Map<number, Attendance[]> {
  const map = new Map<number, Attendance[]>();
  for (const a of attendances) {
    const list = map.get(a.training);
    if (list) list.push(a);
    else map.set(a.training, [a]);
  }
  return map;
}

/** 훈련일에 부상 기간이 걸친 선수 id — 참석 체크에서 비활성 처리한다.
 *  발생일 당일은 허용(백엔드 trainingInjuryConflict와 동일 규칙). */
export function injuredPlayerIdsOnTraining(
  injuries: Injury[],
  trainingdate: string,
): Set<number> {
  const ids = new Set<number>();
  for (const injury of injuries) {
    if (injuryCoversMatch(injury, trainingdate)) ids.add(injury.player);
  }
  return ids;
}

export interface PlayerTrainingStats {
  /** 참석한 훈련 수. */
  attended: number;
  /** 분모 — 지금까지 열린 훈련 수. */
  held: number;
  /** 참석률(%). held가 0이면 0. */
  rate: number;
  /** 총 훈련 시간(분). */
  totalMin: number;
}

/** 선수별 참석 횟수·참석률·총 훈련 시간 — 클라이언트 집계(absentGames 방식). */
export function playerTrainingStats(
  playerId: number,
  trainings: Training[],
  attendances: Attendance[],
  until: string = today(),
): PlayerTrainingStats {
  const held = heldTrainings(trainings, until);
  const heldIds = new Set(held.map((t) => t.id));
  const mine = attendances.filter(
    (a) => a.player === playerId && heldIds.has(a.training),
  );
  const attended = mine.length;
  const totalMin = mine.reduce((sum, a) => sum + a.min, 0);
  const rate = held.length === 0 ? 0 : Math.round((attended / held.length) * 100);
  return { attended, held: held.length, rate, totalMin };
}
