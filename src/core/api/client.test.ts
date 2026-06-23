import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server, API_BASE } from "../../test/server";
import {
  api,
  ApiError,
  getToken,
  setToken,
  UNAUTHORIZED_EVENT,
} from "./client";

// Asserts the promise rejects with an ApiError and returns it narrowed, so
// callers can inspect status/code/message without an unchecked cast.
async function expectApiError(promise: Promise<unknown>): Promise<ApiError> {
  const err = await promise.then(
    () => {
      throw new Error("expected the request to reject");
    },
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ApiError);
  return err as ApiError;
}

describe("api.get", () => {
  it("returns the parsed JSON body on success", async () => {
    server.use(
      http.get(`${API_BASE}/team`, () =>
        HttpResponse.json({ code: "ok", items: [{ id: 1 }] }),
      ),
    );
    const res = await api.get<{ code: string; items: unknown[] }>("/team");
    expect(res.code).toBe("ok");
    expect(res.items).toHaveLength(1);
  });

  it("attaches the bearer token when one is stored", async () => {
    setToken("jwt-123");
    let authHeader: string | null = null;
    server.use(
      http.get(`${API_BASE}/team`, ({ request }) => {
        authHeader = request.headers.get("authorization");
        return HttpResponse.json({ code: "ok" });
      }),
    );
    await api.get("/team");
    expect(authHeader).toBe("Bearer jwt-123");
  });

  it("omits empty/null query params and serializes the rest", async () => {
    let url = "";
    server.use(
      http.get(`${API_BASE}/team`, ({ request }) => {
        url = request.url;
        return HttpResponse.json({ code: "ok" });
      }),
    );
    await api.get("/team", { user: 5, q: "", missing: null });
    const params = new URL(url).searchParams;
    expect(params.get("user")).toBe("5");
    expect(params.has("q")).toBe(false);
    expect(params.has("missing")).toBe(false);
  });
});

describe("error handling", () => {
  it("on 401: clears the token, fires the logout event, throws ApiError(401)", async () => {
    setToken("expired");
    const onUnauthorized = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    server.use(
      http.get(`${API_BASE}/team`, () => new HttpResponse(null, { status: 401 })),
    );

    try {
      const err = await expectApiError(api.get("/team"));
      expect(err.status).toBe(401);
      expect(getToken()).toBeNull();
      expect(onUnauthorized).toHaveBeenCalledOnce();
    } finally {
      window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    }
  });

  it("treats a 200 { code: 'error' } envelope as a failure", async () => {
    server.use(
      http.get(`${API_BASE}/team`, () =>
        HttpResponse.json({ code: "error", message: "잘못된 요청" }),
      ),
    );
    const err = await expectApiError(api.get("/team"));
    expect(err.code).toBe("error");
    expect(err.message).toBe("잘못된 요청");
    expect(err.status).toBe(200);
  });

  it("surfaces the server message on a non-2xx response", async () => {
    server.use(
      http.get(`${API_BASE}/team`, () =>
        HttpResponse.json({ message: "서버 오류" }, { status: 500 }),
      ),
    );
    const err = await expectApiError(api.get("/team"));
    expect(err.status).toBe(500);
    expect(err.message).toBe("서버 오류");
  });

  it("normalizes a network failure to ApiError(status 0)", async () => {
    server.use(http.get(`${API_BASE}/team`, () => HttpResponse.error()));
    const err = await expectApiError(api.get("/team"));
    expect(err.status).toBe(0);
    expect(err.message).toContain("네트워크");
  });
});

describe("api.post", () => {
  it("sends a JSON body and returns the response", async () => {
    let received: unknown = null;
    let contentType: string | null = null;
    server.use(
      http.post(`${API_BASE}/team`, async ({ request }) => {
        contentType = request.headers.get("content-type");
        received = await request.json();
        return HttpResponse.json({ code: "ok", id: 7 });
      }),
    );
    const res = await api.post<{ code: string; id: number }>("/team", {
      user: 1,
      name: "FC 서울",
    });
    expect(contentType).toContain("application/json");
    expect(received).toEqual({ user: 1, name: "FC 서울" });
    expect(res.id).toBe(7);
  });
});
