import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderHookWithClient } from "../../test/renderHook";
import { qk } from "../../lib/queryKeys";
import {
  useMatches,
  useMatch,
  useCreateMatch,
  useDeleteMatch,
  useUpcomingMatches,
  usePastMatchesInfinite,
} from "./useMatches";

describe("useMatches", () => {
  it("requests the full team list and unwraps the matches array", async () => {
    let pagesize: string | null = null;
    server.use(
      http.get(`${API_BASE}/match`, ({ request }) => {
        pagesize = new URL(request.url).searchParams.get("pagesize");
        return HttpResponse.json({
          code: "ok",
          items: [{ id: 10, team: 1, awayname: "수원", matchdate: "2026-06-01 19:00:00" }],
          total: 1,
        });
      }),
    );

    const { result } = renderHookWithClient(() => useMatches(1));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(pagesize).toBe("500");
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].awayname).toBe("수원");
  });

  it("stays idle for a non-positive team id", () => {
    const { result } = renderHookWithClient(() => useMatches(0));
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMatch", () => {
  it("stays idle (disabled) for id 0", () => {
    const { result } = renderHookWithClient(() => useMatch(0));
    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });
});

describe("useCreateMatch", () => {
  it("POSTs the match and invalidates the team's match list", async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/match`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 99 });
      }),
    );

    const { result, client } = renderHookWithClient(() => useCreateMatch(1));
    const invalidate = vi.spyOn(client, "invalidateQueries");

    await result.current.mutateAsync({
      team: 1,
      awayname: "FC 안양",
      matchdate: "2026-07-01 18:00:00",
    });

    expect(body).toEqual({
      team: 1,
      awayname: "FC 안양",
      matchdate: "2026-07-01 18:00:00",
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.matches(1) });
  });
});

describe("useDeleteMatch", () => {
  it("invalidates the list and evicts the match's detail + quarters cache", async () => {
    server.use(
      http.delete(`${API_BASE}/match`, () => HttpResponse.json({ code: "ok" })),
    );

    const { result, client } = renderHookWithClient(() => useDeleteMatch(1));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const remove = vi.spyOn(client, "removeQueries");

    await result.current.mutateAsync(10);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.matches(1) });
    expect(remove).toHaveBeenCalledWith({ queryKey: qk.match(10) });
    expect(remove).toHaveBeenCalledWith({ queryKey: qk.quarters(10) });
  });
});

describe("useUpcomingMatches", () => {
  it("requests matches from `now` onward, ascending", async () => {
    let params: URLSearchParams | null = null;
    server.use(
      http.get(`${API_BASE}/match`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({ code: "ok", items: [] });
      }),
    );

    const { result } = renderHookWithClient(() =>
      useUpcomingMatches(1, "2026-06-23 12:00:00"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(params!.get("startmatchdate")).toBe("2026-06-23 12:00:00");
    expect(params!.get("orderby")).toBe("matchdate asc");
    expect(params!.get("pagesize")).toBe("100");
  });
});

describe("usePastMatchesInfinite", () => {
  it("requests past matches descending and exposes a next page while loaded < total", async () => {
    let params: URLSearchParams | null = null;
    server.use(
      http.get(`${API_BASE}/match`, ({ request }) => {
        params = new URL(request.url).searchParams;
        return HttpResponse.json({
          code: "ok",
          items: [{ id: 1, team: 1, awayname: "A", matchdate: "2026-05-01 19:00:00" }],
          total: 2, // one of two loaded -> more remain
        });
      }),
    );

    const { result } = renderHookWithClient(() =>
      usePastMatchesInfinite(1, "2026-06-23 12:00:00"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(params!.get("endmatchdate")).toBe("2026-06-23 12:00:00");
    expect(params!.get("orderby")).toBe("matchdate desc");
    expect(params!.get("pagesize")).toBe("20");
    expect(result.current.hasNextPage).toBe(true);
  });

  it("has no next page once everything is loaded", async () => {
    server.use(
      http.get(`${API_BASE}/match`, () =>
        HttpResponse.json({
          code: "ok",
          items: [{ id: 1, team: 1, awayname: "A", matchdate: "2026-05-01 19:00:00" }],
          total: 1,
        }),
      ),
    );

    const { result } = renderHookWithClient(() =>
      usePastMatchesInfinite(1, "2026-06-23 12:00:00"),
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });
});
