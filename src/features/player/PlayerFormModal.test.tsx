import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import PlayerFormModal from "./PlayerFormModal";

describe("PlayerFormModal", () => {
  it("requires a name", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithClient(<PlayerFormModal teamId={1} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("선수 이름을 입력해주세요.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  // Branch-level number validation (0/negative/non-integer/range) lives in
  // validatePlayerForm and is unit-tested in playerForm.test.ts. Here we only
  // confirm the modal surfaces a validation failure and blocks the request.
  it("rejects an empty jersey number instead of submitting 0", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    // No POST handler: a leaked request would fail under onUnhandledRequest.
    renderWithClient(<PlayerFormModal teamId={1} onClose={onClose} />);

    await user.type(screen.getByLabelText("이름"), "손흥민");
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("등번호를 입력해주세요.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("creates the player with the default position on a valid submit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/player`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 5 });
      }),
    );

    renderWithClient(<PlayerFormModal teamId={1} onClose={onClose} />);
    await user.type(screen.getByLabelText("이름"), "손흥민");
    await user.type(screen.getByLabelText("등번호"), "7");
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({
      team: 1,
      name: "손흥민",
      number: 7,
      position: "ST",
    });
  });
});
