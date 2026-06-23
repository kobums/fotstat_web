import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import QuarterFormModal from "./QuarterFormModal";

describe("QuarterFormModal", () => {
  it("rejects an empty/zero duration", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithClient(
      <QuarterFormModal matchId={5} nextNumber={3} onClose={onClose} />,
    );

    // Clearing leaves ""; Number("") === 0, which fails the dur > 0 check.
    await user.clear(screen.getByLabelText("진행 시간 (분)"));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("시간을 확인해주세요.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("creates the quarter with the default 25-minute duration", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/quarter`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );

    renderWithClient(
      <QuarterFormModal matchId={5} nextNumber={3} onClose={onClose} />,
    );
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({ match: 5, number: 3, duration: 25 });
  });
});
