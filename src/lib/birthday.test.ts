import { describe, it, expect } from "vitest";
import type { Player } from "../core/api/types";
import {
  birthdayAgeOn,
  birthdayMonthDays,
  birthdayPlayersOn,
  isBirthdayOn,
  monthDayKey,
} from "./birthday";

function player(id: number, name: string, birthdate?: string): Player {
  return { id, team: 1, name, number: id, birthdate, position: "MF" };
}

describe("monthDayKey", () => {
  it("YYYY-MM-DD에서 MM-DD를 뽑는다", () => {
    expect(monthDayKey("2010-03-15")).toBe("03-15");
  });
  it("빈 값·형식 오류는 빈 문자열", () => {
    expect(monthDayKey("")).toBe("");
    expect(monthDayKey(undefined)).toBe("");
    expect(monthDayKey("2010-3-5")).toBe("");
    expect(monthDayKey("2010-03-15 00:00:00")).toBe("");
  });
});

describe("isBirthdayOn", () => {
  it("연도가 달라도 월·일이 같으면 생일", () => {
    expect(isBirthdayOn("2010-03-15", "2026-03-15")).toBe(true);
    expect(isBirthdayOn("2010-03-15", "1999-03-15")).toBe(true);
  });
  it("월·일이 다르면 생일이 아니다", () => {
    expect(isBirthdayOn("2010-03-15", "2026-03-16")).toBe(false);
    expect(isBirthdayOn("2010-03-15", "2026-05-15")).toBe(false);
  });
  it("birthdate가 없으면 항상 false", () => {
    expect(isBirthdayOn(undefined, "2026-03-15")).toBe(false);
    expect(isBirthdayOn("", "2026-03-15")).toBe(false);
  });
  it("2월 29일생은 윤년 2월 29일에만 정확히 일치한다", () => {
    expect(isBirthdayOn("2008-02-29", "2028-02-29")).toBe(true);
    expect(isBirthdayOn("2008-02-29", "2026-02-28")).toBe(false);
    expect(isBirthdayOn("2008-02-29", "2026-03-01")).toBe(false);
  });
});

describe("birthdayMonthDays", () => {
  it("생일이 있는 선수의 MM-DD 집합을 만든다 (없는 선수는 제외)", () => {
    const days = birthdayMonthDays([
      player(1, "홍길동", "2010-03-15"),
      player(2, "김철수"),
      player(3, "이영희", "2011-03-15"),
      player(4, "박민수", "2012-12-01"),
    ]);
    expect(days).toEqual(new Set(["03-15", "12-01"]));
  });
  it("선수가 없으면 빈 집합", () => {
    expect(birthdayMonthDays([]).size).toBe(0);
  });
});

describe("birthdayPlayersOn", () => {
  const squad = [
    player(1, "홍길동", "2010-03-15"),
    player(2, "김철수"),
    player(3, "이영희", "1998-03-15"),
    player(4, "박민수", "2012-12-01"),
  ];
  it("해당 날짜가 생일인 선수만 입력 순서대로 반환", () => {
    expect(birthdayPlayersOn(squad, "2026-03-15").map((p) => p.name)).toEqual([
      "홍길동",
      "이영희",
    ]);
    expect(birthdayPlayersOn(squad, "2026-12-01").map((p) => p.id)).toEqual([4]);
    expect(birthdayPlayersOn(squad, "2026-07-01")).toEqual([]);
  });
});

describe("birthdayAgeOn", () => {
  it("생일 당일의 만 나이 = 연도 차이", () => {
    expect(birthdayAgeOn("2010-03-15", "2026-03-15")).toBe(16);
    expect(birthdayAgeOn("2026-03-15", "2026-03-15")).toBe(0);
  });
  it("잘못된 입력·음수 나이는 null", () => {
    expect(birthdayAgeOn(undefined, "2026-03-15")).toBeNull();
    expect(birthdayAgeOn("", "2026-03-15")).toBeNull();
    expect(birthdayAgeOn("2030-03-15", "2026-03-15")).toBeNull();
  });
});
