import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderWithClient } from "../../test/render";
import TeamFormModal from "./TeamFormModal";

// useCreateTeam reads the current user from AuthContext.
vi.mock("../../core/auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

describe("TeamFormModal", () => {
  it("blocks submit and shows an error when the name is empty", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    // No POST handler registered: if it submitted, MSW would fail the test.
    renderWithClient(<TeamFormModal onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByText("팀 이름을 입력해주세요.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("creates the team and closes on a valid submit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/team`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );

    renderWithClient(<TeamFormModal onClose={onClose} />);
    await user.type(screen.getByLabelText("팀 이름"), "FC 서울");
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(body).toEqual({ user: 1, name: "FC 서울" });
  });

  it("trims surrounding whitespace from the name", async () => {
    const user = userEvent.setup();
    let body: { name?: string } | null = null;
    server.use(
      http.post(`${API_BASE}/team`, async ({ request }) => {
        body = (await request.json()) as { name?: string };
        return HttpResponse.json({ code: "ok", id: 1 });
      }),
    );

    renderWithClient(<TeamFormModal onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("팀 이름"), "  수원 FC  ");
    await user.click(screen.getByRole("button", { name: "추가" }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body!.name).toBe("수원 FC");
  });
});
