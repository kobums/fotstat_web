import { describe, expect, it } from "vitest";
import type { Attendance, Injury, Training } from "../core/api/types";
import {
  attendancesByTraining,
  byTrainingdateDesc,
  heldTrainings,
  injuredPlayerIdsOnTraining,
  playerTrainingStats,
} from "./training";

function training(id: number, trainingdate: string): Training {
  return { id, team: 1, trainingdate };
}

function attendance(training: number, player: number, min: number): Attendance {
  return { id: training * 100 + player, training, player, min };
}

describe("byTrainingdateDesc", () => {
  it("최근 훈련이 먼저 오도록 정렬한다", () => {
    const list = [
      training(1, "2026-07-01 19:00:00"),
      training(2, "2026-07-08 19:00:00"),
    ];
    expect([...list].sort(byTrainingdateDesc).map((t) => t.id)).toEqual([2, 1]);
  });
});

describe("heldTrainings", () => {
  it("기준일 이후의 미래 훈련은 제외한다", () => {
    const list = [
      training(1, "2026-07-01 19:00:00"),
      training(2, "2026-07-10 19:00:00"),
      training(3, "2026-07-20 19:00:00"),
    ];
    expect(heldTrainings(list, "2026-07-10").map((t) => t.id)).toEqual([1, 2]);
  });
});

describe("attendancesByTraining", () => {
  it("training id로 그룹핑한다", () => {
    const map = attendancesByTraining([
      attendance(1, 10, 60),
      attendance(1, 11, 90),
      attendance(2, 10, 60),
    ]);
    expect(map.get(1)?.length).toBe(2);
    expect(map.get(2)?.length).toBe(1);
    expect(map.get(3)).toBeUndefined();
  });
});

describe("injuredPlayerIdsOnTraining", () => {
  const injury: Injury = {
    id: 1,
    player: 10,
    startdate: "2026-07-01",
    returndate: "2026-07-10",
  };

  it("부상 기간에 걸친 훈련이면 해당 선수를 포함한다", () => {
    expect(injuredPlayerIdsOnTraining([injury], "2026-07-05 19:00:00")).toEqual(
      new Set([10]),
    );
  });

  it("발생일 당일 훈련은 허용한다 (백엔드와 동일 규칙)", () => {
    expect(
      injuredPlayerIdsOnTraining([injury], "2026-07-01 19:00:00").size,
    ).toBe(0);
  });

  it("복귀일 다음 날부터는 제외한다", () => {
    expect(
      injuredPlayerIdsOnTraining([injury], "2026-07-11 19:00:00").size,
    ).toBe(0);
  });
});

describe("playerTrainingStats", () => {
  const trainings = [
    training(1, "2026-07-01 19:00:00"),
    training(2, "2026-07-08 19:00:00"),
    training(3, "2026-07-20 19:00:00"), // 미래 — 분모 제외
  ];
  const attendances = [
    attendance(1, 10, 60),
    attendance(2, 10, 90),
    attendance(3, 10, 60), // 미래 훈련 참석 예약 — 집계 제외
    attendance(1, 11, 60),
  ];

  it("참석 횟수·참석률·총 시간을 집계한다", () => {
    const stats = playerTrainingStats(10, trainings, attendances, "2026-07-10");
    expect(stats).toEqual({ attended: 2, held: 2, rate: 100, totalMin: 150 });
  });

  it("결석이 있으면 참석률이 내려간다", () => {
    const stats = playerTrainingStats(11, trainings, attendances, "2026-07-10");
    expect(stats).toEqual({ attended: 1, held: 2, rate: 50, totalMin: 60 });
  });

  it("열린 훈련이 없으면 0%다", () => {
    const stats = playerTrainingStats(10, [], attendances, "2026-07-10");
    expect(stats).toEqual({ attended: 0, held: 0, rate: 0, totalMin: 0 });
  });
});
