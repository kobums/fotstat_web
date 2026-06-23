import { describe, it, expect, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderHookWithClient } from "../../test/renderHook";
import { qk } from "../../lib/queryKeys";
import {
  useQuarters,
  useCreateQuarter,
  useDeleteQuarter,
} from "./useQuarters";

describe("useQuarters", () => {
  it("lists the match's quarters", async () => {
    let match: string | null = null;
    server.use(
      http.get(`${API_BASE}/quarter`, ({ request }) => {
        match = new URL(request.url).searchParams.get("match");
        return HttpResponse.json({
          code: "ok",
          items: [{ id: 1, match: 5, number: 1, duration: 25, awaygoals: 0 }],
        });
      }),
    );

    const { result } = renderHookWithClient(() => useQuarters(5));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(match).toBe("5");
    expect(result.current.data).toHaveLength(1);
  });

  it("stays idle for a non-positive match id", () => {
    const { result } = renderHookWithClient(() => useQuarters(0));
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateQuarter", () => {
  it("merges the match id into the POST body", async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/quarter`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 3 });
      }),
    );

    const { result } = renderHookWithClient(() => useCreateQuarter(5));
    await result.current.mutateAsync({ number: 2, duration: 30 });

    expect(body).toEqual({ match: 5, number: 2, duration: 30 });
  });
});

describe("useDeleteQuarter", () => {
  it("invalidates the quarters list and evicts the orphaned records cache", async () => {
    server.use(
      http.delete(`${API_BASE}/quarter`, () => HttpResponse.json({ code: "ok" })),
    );

    const { result, client } = renderHookWithClient(() => useDeleteQuarter(5));
    const invalidate = vi.spyOn(client, "invalidateQueries");
    const remove = vi.spyOn(client, "removeQueries");

    await result.current.mutateAsync(7); // quarter id 7

    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.quarters(5) });
    expect(remove).toHaveBeenCalledWith({ queryKey: qk.records(7) });
  });
});
