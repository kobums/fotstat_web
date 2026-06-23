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

  // Note: the non-integer/negative jersey-number branch is hard to exercise
  // deterministically through a controlled <input type="number"> (jsdom/React
  // sanitize intermediate values like "7."). It would be better covered by
  // extracting the validation into a pure function — left for a follow-up.

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
