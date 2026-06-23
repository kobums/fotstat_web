import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "./test/server";
import { makeTestQueryClient } from "./test/renderHook";
import { ThemeProvider } from "./core/theme/ThemeContext";
import { AuthProvider } from "./core/auth/AuthContext";
import { routes } from "./routes";

const USER = { id: 1, name: "고범석", email: "kobums@example.com" };

/** Persist a session the way AuthProvider expects (it restores from storage). */
function signIn(user = USER) {
  localStorage.setItem("fotstat.token", "test-token");
  localStorage.setItem("fotstat.user", JSON.stringify(user));
}

/** Mount the real route tree under a memory router + the app's providers. */
function renderApp(initialEntries: string[]) {
  const client = makeTestQueryClient();
  const router = createMemoryRouter(routes, { initialEntries });
  render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { router };
}

function mockTeamList(teams = [{ id: 1, user: 1, name: "FC 서울" }]) {
  server.use(
    http.get(`${API_BASE}/team`, () =>
      HttpResponse.json({ code: "ok", items: teams }),
    ),
  );
}

/** Handlers for the /teams/:id detail subtree: useTeam + useMatches. Empty
 *  matches stop the quarter/record cascade so no further handlers are needed. */
function mockTeamDetail() {
  server.use(
    http.get(`${API_BASE}/team/1`, () =>
      HttpResponse.json({ code: "ok", item: { id: 1, user: 1, name: "FC 서울" } }),
    ),
    http.get(`${API_BASE}/match`, () =>
      HttpResponse.json({ code: "ok", items: [] }),
    ),
  );
}

describe("routing — public + guard", () => {
  it("renders the landing page at /", () => {
    renderApp(["/"]);
    expect(screen.getByText("유소년부터 프로까지")).toBeInTheDocument();
  });

  it("redirects an unauthenticated user from a protected route to /login", () => {
    const { router } = renderApp(["/myteam"]);
    expect(router.state.location.pathname).toBe("/login");
    expect(screen.getByRole("button", { name: "로그인" })).toBeInTheDocument();
  });

  it("sends unknown paths to the landing page when signed out", () => {
    const { router } = renderApp(["/does-not-exist"]);
    expect(router.state.location.pathname).toBe("/");
    expect(screen.getByText("유소년부터 프로까지")).toBeInTheDocument();
  });
});

describe("routing — authenticated", () => {
  it("renders the team list at /myteam with the user's teams", async () => {
    signIn();
    mockTeamList();
    renderApp(["/myteam"]);

    // The card button (sidebar uses links) confirms TeamListPage rendered.
    expect(
      await screen.findByRole("button", { name: /FC 서울/ }),
    ).toBeInTheDocument();
  });

  it("sends unknown paths to /myteam when signed in", async () => {
    signIn();
    mockTeamList();
    const { router } = renderApp(["/does-not-exist"]);

    await screen.findByRole("button", { name: /FC 서울/ });
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/myteam"),
    );
  });

  it("navigates to the team detail route when a team card is clicked", async () => {
    const user = userEvent.setup();
    signIn();
    mockTeamList();
    mockTeamDetail();
    const { router } = renderApp(["/myteam"]);

    await user.click(await screen.findByRole("button", { name: /FC 서울/ }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/teams/1"),
    );
  });
});
