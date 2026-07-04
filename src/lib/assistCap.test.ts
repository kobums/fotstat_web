import { describe, it, expect } from "vitest";
import { assistCap, clampAssist, rebalanceAssists } from "./assistCap";

describe("assistCap", () => {
  it("자기 골에는 어시스트를 붙일 수 없다 (남의 골이 없으면 캡 0)", () => {
    expect(assistCap({ othersGoals: 0, othersAssists: 0, ownGoals: 3 })).toBe(0);
  });

  it("남의 골 수까지만 어시스트할 수 있다", () => {
    expect(assistCap({ othersGoals: 2, othersAssists: 0, ownGoals: 0 })).toBe(2);
  });

  it("팀 어시스트 합이 팀 골 합을 넘지 못한다", () => {
    // 팀 골 3(남 2 + 나 1), 남의 어시 2 → 내 몫은 1
    expect(assistCap({ othersGoals: 2, othersAssists: 2, ownGoals: 1 })).toBe(1);
  });

  it("남의 어시스트가 이미 팀 골 합을 채우면 캡 0", () => {
    expect(assistCap({ othersGoals: 1, othersAssists: 3, ownGoals: 0 })).toBe(0);
  });

  it("내 골이 늘면 규칙 ②의 여유는 늘지만 규칙 ①(남의 골)이 상한", () => {
    // 남의 골 1 → 내 골이 아무리 많아도 캡은 1
    expect(assistCap({ othersGoals: 1, othersAssists: 0, ownGoals: 5 })).toBe(1);
  });

  it("골이 하나도 없으면 캡 0", () => {
    expect(assistCap({ othersGoals: 0, othersAssists: 0, ownGoals: 0 })).toBe(0);
  });
});

describe("clampAssist", () => {
  it("캡을 넘는 어시스트를 캡으로 내린다", () => {
    expect(clampAssist(3, { othersGoals: 2, othersAssists: 0, ownGoals: 0 })).toBe(2);
  });

  it("캡 이하 값은 그대로 둔다", () => {
    expect(clampAssist(1, { othersGoals: 2, othersAssists: 0, ownGoals: 0 })).toBe(1);
  });

  it("골 감소로 캡이 0이 되면 어시스트도 0", () => {
    // 다른 선수의 골이 삭제된 상황: 남의 골 0, 내 골 0
    expect(clampAssist(2, { othersGoals: 0, othersAssists: 0, ownGoals: 0 })).toBe(0);
  });
});

describe("rebalanceAssists", () => {
  it("불변식이 유지되면 아무것도 바꾸지 않는다", () => {
    expect(
      rebalanceAssists([
        { id: 1, player: 10, goal: 1, assist: 0 },
        { id: 2, player: 20, goal: 0, assist: 1 },
      ]),
    ).toEqual([]);
  });

  it("골이 사라지면 남아 있던 어시스트를 잘라낸다", () => {
    // A의 골 1 → 0으로 수정된 뒤: 팀 골 0인데 B의 어시 1이 남은 상황
    expect(
      rebalanceAssists([
        { id: 1, player: 10, goal: 0, assist: 0 },
        { id: 2, player: 20, goal: 0, assist: 1 },
      ]),
    ).toEqual([{ id: 2, assist: 0 }]);
  });

  it("본인 골보다 많은 팀 골이 없으면 그 선수의 어시스트를 캡으로 내린다", () => {
    // 팀 골 2, 본인 골 2 → 캡 0
    expect(
      rebalanceAssists([
        { id: 1, player: 10, goal: 2, assist: 1 },
        { id: 2, player: 20, goal: 0, assist: 0 },
      ]),
    ).toEqual([{ id: 1, assist: 0 }]);
  });

  it("초과분은 목록 아래쪽 기록부터 차감한다 (iOS와 동일)", () => {
    // 팀 골 1, 어시 합 2 → 초과 1은 아래쪽(id 3)부터 깎는다
    expect(
      rebalanceAssists([
        { id: 1, player: 10, goal: 1, assist: 0 },
        { id: 2, player: 20, goal: 0, assist: 1 },
        { id: 3, player: 30, goal: 0, assist: 1 },
      ]),
    ).toEqual([{ id: 3, assist: 0 }]);
  });

  it("잠긴(부상) 선수의 기록은 건드리지 않는다", () => {
    expect(
      rebalanceAssists(
        [
          { id: 1, player: 10, goal: 0, assist: 0 },
          { id: 2, player: 20, goal: 0, assist: 1 },
        ],
        new Set([20]),
      ),
    ).toEqual([]);
  });
});
