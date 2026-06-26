import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import type { Player } from "../../core/api/types";
import RecordFormModal from "./RecordFormModal";

const PLAYERS: Player[] = [
  { id: 2, team: 1, name: "손흥민", number: 7, position: "ST" },
];

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
