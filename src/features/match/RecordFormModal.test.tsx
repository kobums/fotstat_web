import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import type { MatchRecord, Player } from "../../core/api/types";
import RecordFormModal from "./RecordFormModal";

const PLAYERS: Player[] = [
  { id: 2, team: 1, name: "손흥민", number: 7, position: "ST" },
];

function makeRecord(over: Partial<MatchRecord>): MatchRecord {
  return {
    id: 9,
    quarter: 7,
    player: 99,
    min: 30,
    goal: 0,
    assist: 0,
    yellowcard: 0,
    redcard: 0,
    ...over,
  };
}

function open(extra?: Partial<React.ComponentProps<typeof RecordFormModal>>) {
  const onClose = vi.fn();
  renderWithClient(
    <RecordFormModal
      quarterId={7}
      quarterDuration={30}
      players={PLAYERS}
      takenPlayerIds={new Set()}
      onClose={onClose}
      {...extra}
    />,
  );
  return { onClose };
}

describe("RecordFormModal", () => {
  it("disables submit and explains when no player is available", () => {
    open({ takenPlayerIds: new Set([2]) }); // the only player is already taken
    expect(
      screen.getByText(/기록할 수 있는 선수가 없습니다/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("increments the goal stepper and posts the new value", async () => {
    const user = userEvent.setup();
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/record`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );
    const { onClose } = open();

    await user.click(screen.getByRole("button", { name: "골 증가" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({
      quarter: 7,
      player: 2,
      min: 0,
      goal: 1,
      assist: 0,
      yellowcard: 0,
      redcard: 0,
    });
  });

  it("'풀타임 채우기' sets minutes to the quarter duration", async () => {
    const user = userEvent.setup();
    let body: { min?: number } | null = null;
    server.use(
      http.post(`${API_BASE}/record`, async ({ request }) => {
        body = (await request.json()) as { min?: number };
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );
    const { onClose } = open();

    await user.click(screen.getByRole("button", { name: /풀타임 채우기/ }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body!.min).toBe(30);
  });
});

describe("RecordFormModal — 어시스트 무결성", () => {
  it("쿼터에 골이 없으면 어시스트를 올릴 수 없다 (자기 골 어시 불가)", async () => {
    const user = userEvent.setup();
    open(); // records 없음 → 남의 골 0

    // 내 골을 올려도 캡은 남의 골(0)에 막힌다
    await user.click(screen.getByRole("button", { name: "골 증가" }));
    expect(screen.getByRole("button", { name: "어시스트 증가" })).toBeDisabled();
  });

  it("남의 골 수까지만 어시스트를 올릴 수 있다", async () => {
    const user = userEvent.setup();
    open({ records: [makeRecord({ goal: 1 })] }); // 남의 골 1

    const inc = screen.getByRole("button", { name: "어시스트 증가" });
    expect(inc).toBeEnabled();
    await user.click(inc); // assist 1 = 캡
    expect(inc).toBeDisabled();
  });

  it("남의 어시스트가 이미 팀 골을 채우면 어시스트 불가", () => {
    // 남의 골 1 + 남의 어시 1 → 팀 어시 합이 골 합에 도달
    open({ records: [makeRecord({ goal: 1, assist: 1 })] });
    expect(screen.getByRole("button", { name: "어시스트 증가" })).toBeDisabled();
  });

  it("골을 내리면 초과한 어시스트가 캡으로 잘려서 저장된다", async () => {
    const user = userEvent.setup();
    let body: { goal?: number; assist?: number } | null = null;
    server.use(
      http.post(`${API_BASE}/record`, async ({ request }) => {
        body = (await request.json()) as { goal?: number; assist?: number };
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );
    // 남의 골 2, 남의 어시 1 → 팀 골 2 기준 내 캡은 min(2, 2-1) = 1
    const { onClose } = open({
      records: [makeRecord({ goal: 2, assist: 1 })],
    });

    await user.click(screen.getByRole("button", { name: "어시스트 증가" })); // assist 1
    // 내 골을 올렸다 내려도(캡 재계산 경로) 어시스트는 캡 안에 남는다
    await user.click(screen.getByRole("button", { name: "골 증가" }));
    await user.click(screen.getByRole("button", { name: "골 감소" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body!.goal).toBe(0);
    expect(body!.assist).toBe(1);
  });

  it("수정에서 골을 내리면 다른 선수의 초과 어시스트도 함께 차감된다", async () => {
    const user = userEvent.setup();
    const puts: Array<{ id?: number; goal?: number; assist?: number }> = [];
    server.use(
      http.put(`${API_BASE}/record/stats`, async ({ request }) => {
        puts.push((await request.json()) as (typeof puts)[number]);
        return HttpResponse.json({ code: "ok" });
      }),
    );
    // 손흥민(2)의 골 1에 99번 선수가 어시 1을 기록한 쿼터
    const mine = makeRecord({ id: 5, player: 2, goal: 1 });
    const other = makeRecord({ id: 9, player: 99, assist: 1 });
    const { onClose } = open({ record: mine, records: [mine, other] });

    await user.click(screen.getByRole("button", { name: "골 감소" })); // 1 → 0
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    // 내 기록 저장 후, 팀 골 0을 초과한 99번의 어시스트가 0으로 잘린다
    expect(puts).toHaveLength(2);
    expect(puts[0]).toMatchObject({ id: 5, goal: 0 });
    expect(puts[1]).toMatchObject({ id: 9, assist: 0 });
  });
});
