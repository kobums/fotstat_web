import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import type { Match } from "../../core/api/types";
import MatchFormModal from "./MatchFormModal";

const API_DATE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

describe("MatchFormModal", () => {
  it("requires an opponent name", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithClient(<MatchFormModal teamId={1} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("상대팀 이름을 입력해주세요.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("creates a match with the opponent and an API-formatted date", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let body: { team?: number; awayname?: string; matchdate?: string } | null = null;
    server.use(
      http.post(`${API_BASE}/match`, async ({ request }) => {
        body = (await request.json()) as typeof body;
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );

    renderWithClient(<MatchFormModal teamId={1} onClose={onClose} />);
    await user.type(screen.getByLabelText("상대팀"), "강남 유나이티드");
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body!.team).toBe(1);
    expect(body!.awayname).toBe("강남 유나이티드");
    // The default date comes from nowInputValue(); assert its shape, not value.
    expect(body!.matchdate).toMatch(API_DATE);
  });

  it("updates an existing match (PUT with id, date preserved)", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const match: Match = {
      id: 7,
      team: 1,
      awayname: "수원",
      matchdate: "2026-06-01 19:00:00",
    };
    let body: unknown = null;
    let method = "";
    server.use(
      http.put(`${API_BASE}/match`, async ({ request }) => {
        method = request.method;
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 7 });
      }),
    );

    renderWithClient(<MatchFormModal teamId={1} match={match} onClose={onClose} />);
    await user.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(method).toBe("PUT");
    expect(body).toEqual({
      id: 7,
      team: 1,
      awayname: "수원",
      matchdate: "2026-06-01 19:00:00",
    });
  });
});
