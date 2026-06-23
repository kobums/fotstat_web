import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderHookWithClient } from "../../test/renderHook";
import { useTeams, useTeam } from "./useTeams";

// useTeams reads the current user from AuthContext; mock it so we don't need a
// real AuthProvider + login round-trip.
vi.mock("../../core/auth/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1 } }),
}));

describe("useTeams", () => {
  it("fetches the signed-in user's teams", async () => {
    let requestedUser: string | null = null;
    server.use(
      http.get(`${API_BASE}/team`, ({ request }) => {
        requestedUser = new URL(request.url).searchParams.get("user");
        return HttpResponse.json({
          code: "ok",
          items: [
            { id: 1, user: 1, name: "FC 서울" },
            { id: 2, user: 1, name: "수원 FC" },
          ],
        });
      }),
    );

    const { result } = renderHookWithClient(() => useTeams());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(requestedUser).toBe("1");
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe("FC 서울");
  });
});

describe("useTeam", () => {
  it("stays idle (disabled) for a non-positive id and makes no request", async () => {
    // No handler registered: if it fired a request, MSW's onUnhandledRequest
    // would fail the test.
    const { result } = renderHookWithClient(() => useTeam(0));
    // A disabled query never starts: pending status but idle (not fetching).
    expect(result.current.status).toBe("pending");
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});
