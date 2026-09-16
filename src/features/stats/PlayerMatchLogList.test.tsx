import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { PlayerMatchLog } from "./playerMatchLog";
import PlayerMatchLogList from "./PlayerMatchLogList";

const logs: PlayerMatchLog[] = [
  {
    matchId: 1,
    opponent: "A팀",
    matchdate: "2026-06-08 10:00:00",
    home: 2,
    away: 1,
    quarters: [
      { quarterId: 11, number: 1, min: 15, goal: 1, assist: 0, yellow: 1, red: 0 },
      { quarterId: 12, number: 2, min: 15, goal: 1, assist: 1, yellow: 0, red: 0 },
    ],
    min: 30,
    goal: 2,
    assist: 1,
    yellow: 1,
    red: 0,
  },
];

function renderList(props: Partial<Parameters<typeof PlayerMatchLogList>[0]> = {}) {
  return render(
    <MemoryRouter>
      <PlayerMatchLogList logs={logs} {...props} />
    </MemoryRouter>,
  );
}

describe("PlayerMatchLogList", () => {
  it("빈 목록이면 안내 문구", () => {
    renderList({ logs: [] });
    expect(screen.getByText("이 기간에 출전한 경기가 없습니다")).toBeInTheDocument();
  });

  it("경기 행에 날짜·상대·스코어·합계를 표시하고 쿼터는 접혀 있다", () => {
    renderList();
    expect(screen.getByText("06.08")).toBeInTheDocument();
    expect(screen.getByText("A팀")).toBeInTheDocument();
    expect(screen.getByText("2:1")).toBeInTheDocument();
    expect(screen.getByText("30′")).toBeInTheDocument();
    expect(screen.queryByText("Q1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("행을 누르면 쿼터 라인과 경기 상세 링크가 펼쳐지고 다시 누르면 접힌다", async () => {
    const user = userEvent.setup();
    renderList({ matchHref: (id) => `/teams/1/matches/${id}` });
    const row = screen.getByRole("button", { expanded: false });

    await user.click(row);
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(screen.getByText("Q2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "경기 상세 →" })).toHaveAttribute(
      "href",
      "/teams/1/matches/1",
    );
    expect(row).toHaveAttribute("aria-expanded", "true");

    await user.click(row);
    expect(screen.queryByText("Q1")).not.toBeInTheDocument();
  });

  it("키보드 Enter로도 펼친다 (셰브런 버튼)", async () => {
    const user = userEvent.setup();
    renderList();
    const btn = screen.getByRole("button", { expanded: false });
    expect(btn.tagName).toBe("BUTTON");
    btn.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Q1")).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("행 어디를 눌러도 펼쳐진다 (셀 클릭)", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByText("A팀"));
    expect(screen.getByText("Q1")).toBeInTheDocument();
  });

  it("matchHref가 없으면 링크를 만들지 않는다", async () => {
    const user = userEvent.setup();
    renderList();
    await user.click(screen.getByRole("button", { expanded: false }));
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
