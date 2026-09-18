import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PlayerTrainingStats } from "../../lib/training";
import type { PlayerStat } from "../stats/aggregateTeamStats";
import TeamRankCard from "./TeamRankCard";

const stat = (p: Partial<PlayerStat> & Pick<PlayerStat, "id">): PlayerStat => ({
  name: `P${p.id}`,
  number: p.id,
  position: "CM",
  games: 0,
  min: 0,
  goal: 0,
  assist: 0,
  yellow: 0,
  red: 0,
  absentGames: 0,
  ...p,
});

// 5명 이상 → "상위 N%" 표기
const squad: PlayerStat[] = [
  stat({ id: 1, games: 4, goal: 4, assist: 2, min: 200 }),
  stat({ id: 2, games: 2, goal: 3, assist: 0, min: 100 }),
  stat({ id: 3, games: 4, goal: 0, assist: 4, min: 240 }),
  stat({ id: 4, games: 1, goal: 1, assist: 1, min: 40 }),
  stat({ id: 5 }),
];

describe("TeamRankCard", () => {
  it("합계 모드가 기본이고 지표별 값·팀 평균·상위 % 배지를 표시한다", () => {
    render(<TeamRankCard playerId={2} players={squad} />);
    expect(screen.getByRole("button", { name: "합계", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "경기당", pressed: false })).toBeInTheDocument();
    expect(screen.getByText("골")).toBeInTheDocument();
    // 선수2 골 3 → 스쿼드 5명 중 2위 → 상위 40%
    expect(screen.getByText("상위 40%")).toBeInTheDocument();
    expect(screen.queryByText("훈련 참석률")).not.toBeInTheDocument();
  });

  it("경기당 토글 시 소수 둘째 자리 값으로 바뀐다", async () => {
    const user = userEvent.setup();
    render(<TeamRankCard playerId={2} players={squad} />);
    await user.click(screen.getByRole("button", { name: "경기당" }));
    // 골 3 / 2경기 = 1.50(공격P도 1.50), 골은 스쿼드 1위 → 상위 20%
    expect(screen.getAllByText("1.50").length).toBeGreaterThan(0);
    expect(screen.getByText("상위 20%")).toBeInTheDocument();
    expect(screen.getAllByText("상위 40%").length).toBe(2); // 공격P·출전 시간은 2위
  });

  it("스쿼드가 5명 미만이면 순위로 표기한다", () => {
    render(<TeamRankCard playerId={2} players={squad.slice(0, 3)} />);
    expect(screen.getAllByText(/위 \/ 3명/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/상위 \d+%/)).not.toBeInTheDocument();
  });

  it("훈련 통계가 있으면 참석률 행을 붙인다", () => {
    const training = new Map<number, PlayerTrainingStats>([
      [2, { attended: 5, held: 10, rate: 50, totalMin: 300 }],
    ]);
    render(<TeamRankCard playerId={2} players={squad} training={training} />);
    expect(screen.getByText("훈련 참석률")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("값이 0인 지표는 배지가 '-' 이고, 경기당 출전 시간은 정수 분이다", async () => {
    const user = userEvent.setup();
    // 선수5 는 기록이 전혀 없다 → 모든 지표가 0
    const { unmount } = render(<TeamRankCard playerId={5} players={squad} />);
    expect(screen.getAllByText("-").length).toBe(4);
    expect(screen.queryByText(/상위 \d+%/)).not.toBeInTheDocument();
    unmount();

    render(<TeamRankCard playerId={2} players={squad} />);
    await user.click(screen.getByRole("button", { name: "경기당" }));
    expect(screen.getByText("50′")).toBeInTheDocument(); // 100분 / 2경기
    expect(screen.queryByText("50.00′")).not.toBeInTheDocument();
  });

  it("스쿼드에 없는 선수면 아무것도 그리지 않는다", () => {
    const { container } = render(<TeamRankCard playerId={99} players={squad} />);
    expect(container).toBeEmptyDOMElement();
  });
});
