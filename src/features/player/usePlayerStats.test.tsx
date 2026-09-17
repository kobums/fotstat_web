import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import { renderHookWithClient } from "../../test/renderHook";
import { usePlayerStats } from "./usePlayerStats";

const item = {
  player: { id: 7, team: 1, name: "홍길동", number: 10, position: "ST" },
  start: "2026-01-01",
  end: "2026-06-30",
  matchCount: 2,
  summary: {
    id: 7, name: "홍길동", number: 10, position: "ST",
    games: 2, min: 50, goal: 2, assist: 1, yellow: 1, red: 0, absentGames: 0,
    training: { attended: 2, held: 2, rate: 100, totalMin: 110 },
  },
  squad: [],
  matches: [],
  injuries: [],
};

describe("usePlayerStats", () => {
  it("기간을 쿼리로 보내고 item 을 언랩한다", async () => {
    let query: URLSearchParams | null = null;
    server.use(
      http.get(`${API_BASE}/player/7/stats`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({ code: "ok", item });
      }),
    );
    const { result } = renderHookWithClient(() =>
      usePlayerStats(7, { start: "2026-01-01", end: "2026-06-30" }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query!.get("start")).toBe("2026-01-01");
    expect(query!.get("end")).toBe("2026-06-30");
    expect(result.current.data?.summary.goal).toBe(2);
    expect(result.current.data?.summary.training?.rate).toBe(100);
  });

  it("빈 기간은 쿼리에서 생략한다", async () => {
    let query: URLSearchParams | null = null;
    server.use(
      http.get(`${API_BASE}/player/7/stats`, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json({ code: "ok", item: { ...item, start: "", end: "" } });
      }),
    );
    const { result } = renderHookWithClient(() => usePlayerStats(7, { start: "", end: "" }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(query!.has("start")).toBe(false);
    expect(query!.has("end")).toBe(false);
  });

  it("item 이 없는 오류 응답은 실패로 보고한다", async () => {
    server.use(
      http.get(`${API_BASE}/player/7/stats`, () =>
        HttpResponse.json({ code: "error", message: "forbidden" }, { status: 403 }),
      ),
    );
    const { result } = renderHookWithClient(() => usePlayerStats(7, { start: "", end: "" }));
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("id 가 0 이면 요청하지 않는다", () => {
    const { result } = renderHookWithClient(() => usePlayerStats(0, { start: "", end: "" }));
    expect(result.current.fetchStatus).toBe("idle");
  });
});
