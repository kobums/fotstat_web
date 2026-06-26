import { describe, it, expect } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderHookWithClient } from "../../test/renderHook";
import { useRecords, useCreateRecord } from "./useRecords";

describe("useRecords", () => {
  it("lists a quarter's records", async () => {
    let quarter: string | null = null;
    server.use(
      http.get(`${API_BASE}/record`, ({ request }) => {
        quarter = new URL(request.url).searchParams.get("quarter");
        return HttpResponse.json({
          code: "ok",
          items: [{ id: 1, quarter: 7, player: 2, min: 20, goal: 1, assist: 0 }],
        });
      }),
    );

    const { result } = renderHookWithClient(() => useRecords(7));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(quarter).toBe("7");
    expect(result.current.data?.[0].goal).toBe(1);
  });

  it("stays idle for a non-positive quarter id", () => {
    const { result } = renderHookWithClient(() => useRecords(0));
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateRecord", () => {
  it("merges the quarter id into the POST body", async () => {
    let body: unknown = null;
    server.use(
      http.post(`${API_BASE}/record`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ code: "ok", id: 4 });
      }),
    );

    const { result } = renderHookWithClient(() => useCreateRecord(7));
    await result.current.mutateAsync({
      player: 2,
      min: 20,
      goal: 1,
      assist: 0,
      yellowcard: 0,
      redcard: 0,
    });

    expect(body).toEqual({
      quarter: 7,
      player: 2,
      min: 20,
      goal: 1,
      assist: 0,
      yellowcard: 0,
      redcard: 0,
    });
  });
});
