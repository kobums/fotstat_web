import { describe, it, expect } from "vitest";
import type { Injury, Match } from "../core/api/types";
import {
  absentGamesFor,
  absentGamesForInjury,
  activeInjuriesSorted,
  injuredPlayerIdsOn,
  injuryCoversMatch,
  isActiveInjury,
  pastInjuriesSorted,
  playerInjuriesSorted,
} from "./injury";

function injury(p: Partial<Injury> & Pick<Injury, "id" | "player">): Injury {
  return { ...p };
}
function match(id: number, day: string): Match {
  return { id, team: 1, awayname: "상대", matchdate: `${day} 15:00:00` };
}

describe("isActiveInjury", () => {
  it("returndate가 비어 있으면 부상 중", () => {
    expect(isActiveInjury(injury({ id: 1, player: 1, returndate: "" }))).toBe(true);
    expect(isActiveInjury(injury({ id: 1, player: 1 }))).toBe(true);
    expect(isActiveInjury(injury({ id: 1, player: 1, returndate: " " }))).toBe(true);
  });
  it("returndate가 있으면 복귀 완료", () => {
    expect(
      isActiveInjury(injury({ id: 1, player: 1, returndate: "2026-06-20" })),
    ).toBe(false);
  });
});

describe("activeInjuriesSorted / pastInjuriesSorted", () => {
  const list: Injury[] = [
    injury({ id: 1, player: 1, startdate: "2026-05-01", returndate: "" }),
    injury({ id: 2, player: 2, startdate: "2026-05-10", returndate: "2026-05-20" }),
    injury({ id: 3, player: 3, startdate: "2026-05-15", returndate: "" }),
  ];

  it("active만 골라 발생일 내림차순 정렬", () => {
    expect(activeInjuriesSorted(list).map((i) => i.id)).toEqual([3, 1]);
  });
  it("복귀 완료(past)만 골라 정렬", () => {
    expect(pastInjuriesSorted(list).map((i) => i.id)).toEqual([2]);
  });
  it("원본 배열을 변형하지 않는다", () => {
    const before = list.map((i) => i.id);
    activeInjuriesSorted(list);
    pastInjuriesSorted(list);
    expect(list.map((i) => i.id)).toEqual(before);
  });
});

describe("injuryCoversMatch", () => {
  const spell = injury({
    id: 1,
    player: 1,
    startdate: "2026-05-10",
    returndate: "2026-05-25",
  });

  it("발생일 당일 경기는 결장 아님(경기 중 부상 = 그날까지는 뛴 것), 복귀일 당일은 결장", () => {
    expect(injuryCoversMatch(spell, "2026-05-10 15:00:00")).toBe(false);
    expect(injuryCoversMatch(spell, "2026-05-11 15:00:00")).toBe(true);
    expect(injuryCoversMatch(spell, "2026-05-25 15:00:00")).toBe(true);
  });
  it("기간 밖 경기는 제외", () => {
    expect(injuryCoversMatch(spell, "2026-05-09 15:00:00")).toBe(false);
    expect(injuryCoversMatch(spell, "2026-05-26 15:00:00")).toBe(false);
  });
  it("returndate가 비어 있으면(부상 중) 발생일 다음 날부터 전부 포함", () => {
    const open = injury({ id: 2, player: 1, startdate: "2026-05-10" });
    expect(injuryCoversMatch(open, "2030-01-01 15:00:00")).toBe(true);
    expect(injuryCoversMatch(open, "2026-05-10 15:00:00")).toBe(false);
    expect(injuryCoversMatch(open, "2026-05-09 15:00:00")).toBe(false);
  });
  it("startdate가 없으면 항상 false", () => {
    expect(
      injuryCoversMatch(injury({ id: 3, player: 1 }), "2026-05-10 15:00:00"),
    ).toBe(false);
  });
});

describe("injuredPlayerIdsOn", () => {
  it("경기일에 부상 중인 선수 id 집합을 반환", () => {
    const injuries = [
      injury({ id: 1, player: 1, startdate: "2026-05-10", returndate: "2026-05-25" }),
      injury({ id: 2, player: 2, startdate: "2026-06-01" }),
    ];
    expect(injuredPlayerIdsOn(injuries, "2026-05-17 11:00:00")).toEqual(
      new Set([1]),
    );
    expect(injuredPlayerIdsOn(injuries, "2026-06-10 11:00:00")).toEqual(
      new Set([2]),
    );
  });
});

describe("absentGamesForInjury", () => {
  const matches = [
    match(1, "2026-05-03"),
    match(5, "2026-05-10"), // 발생일 당일 — 결장으로 세지 않음
    match(2, "2026-05-17"),
    match(3, "2026-06-01"),
    match(4, "2026-08-15"), // 미래(예정) 경기
  ];

  it("부상 기간에 걸친 경기 수를 센다", () => {
    const spell = injury({
      id: 1,
      player: 1,
      startdate: "2026-05-10",
      returndate: "2026-05-25",
    });
    expect(absentGamesForInjury(spell, matches, "2026-07-02")).toBe(1);
  });
  it("부상 중(returndate 없음)이어도 until 이후의 예정 경기는 결장으로 세지 않는다", () => {
    const open = injury({ id: 2, player: 1, startdate: "2026-05-10" });
    expect(absentGamesForInjury(open, matches, "2026-07-02")).toBe(2);
  });
});

describe("absentGamesFor", () => {
  it("한 선수의 여러 부상 기간을 겹침 없이 합산한다", () => {
    const injuries = [
      injury({ id: 1, player: 1, startdate: "2026-05-01", returndate: "2026-05-10" }),
      injury({ id: 2, player: 1, startdate: "2026-05-05", returndate: "2026-05-20" }), // 1과 겹침
      injury({ id: 3, player: 2, startdate: "2026-05-01" }), // 다른 선수
    ];
    const matches = [
      match(1, "2026-05-03"),
      match(2, "2026-05-17"),
      match(3, "2026-06-01"),
    ];
    expect(absentGamesFor(1, injuries, matches, "2026-07-02")).toBe(2);
    expect(absentGamesFor(3, injuries, matches, "2026-07-02")).toBe(0);
  });
});

describe("playerInjuriesSorted", () => {
  it("해당 선수 부상만 최근 발생순", () => {
    const list: Injury[] = [
      { id: 1, player: 7, startdate: "2026-03-01", returndate: "2026-03-10" },
      { id: 2, player: 8, startdate: "2026-04-01", returndate: "" },
      { id: 3, player: 7, startdate: "2026-05-01", returndate: "" },
    ];
    expect(playerInjuriesSorted(list, 7).map((i) => i.id)).toEqual([3, 1]);
    expect(playerInjuriesSorted(list, 9)).toEqual([]);
  });
});
