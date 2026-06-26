// Thin fetch wrapper for the fotstat Go API.
// - GET sends filters as query string; POST/PUT/DELETE send a JSON body.
// - Auth token is the raw JWT in localStorage; we add the "Bearer " prefix here.
// - On 401 we clear the token and broadcast so AuthContext can log out.

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not defined. Set it in .env / .env.production.",
  );
}
const TOKEN_KEY = "fotstat.token";
const REFRESH_KEY = "fotstat.refresh";
export const UNAUTHORIZED_EVENT = "fotstat:unauthorized";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null): void {
  if (token) localStorage.setItem(REFRESH_KEY, token);
  else localStorage.removeItem(REFRESH_KEY);
}

// Access JWTs are short-lived (24h); the backend also issues a long-lived
// refresh token. When a request 401s we exchange the refresh token for a fresh
// access JWT and retry once, so the session survives access-token expiry instead
// of bouncing the user to the login screen. Concurrent 401s share one in-flight
// refresh (coalescing) to avoid a stampede.
// "refreshed": got a new access token; retry the request.
// "invalid":   the refresh token is rejected/absent — log the user out.
// "transient": the refresh endpoint was unreachable or 5xx — keep the tokens
//              and fail just this request, so a server blip doesn't sign the
//              user out when their refresh token is still good.
type RefreshOutcome = "refreshed" | "invalid" | "transient";
let refreshInFlight: Promise<RefreshOutcome> | null = null;

async function refreshAccessToken(): Promise<RefreshOutcome> {
  const refresh = getRefreshToken();
  if (!refresh) return "invalid";

  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<RefreshOutcome> => {
      try {
        const res = await fetch(buildUrl("/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        // 5xx is a server-side blip, not a bad token — don't discard the session.
        if (res.status >= 500) return "transient";
        if (!res.ok) return "invalid";
        const json = (await res.json()) as {
          code?: string;
          token?: string;
          refresh?: string;
        };
        if (json.code !== "ok" || !json.token) return "invalid";
        setToken(json.token);
        // The refresh token is non-rotating but echoed back; persist whatever
        // the server returns so a future rotation keeps working.
        if (json.refresh) setRefreshToken(json.refresh);
        return "refreshed";
      } catch {
        // Network failure (offline, DNS, CORS) — transient, keep the tokens.
        return "transient";
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${BASE_URL}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === null || value === undefined || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
  retry = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let bodyInit: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyInit = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      headers,
      body: bodyInit,
      signal: opts.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    // Network failure (offline, DNS, CORS): normalize to ApiError(status 0).
    throw new ApiError("네트워크 연결을 확인해주세요.", 0);
  }

  if (res.status === 401) {
    // Try a single refresh-and-retry before giving up.
    if (retry) {
      const outcome = await refreshAccessToken();
      if (outcome === "refreshed") {
        return request<T>(method, path, opts, false);
      }
      if (outcome === "transient") {
        // Couldn't reach the refresh endpoint; keep the session and let the
        // caller retry later instead of bouncing the user to login.
        throw new ApiError(
          "인증 갱신에 일시적으로 실패했습니다. 잠시 후 다시 시도해주세요.",
          401,
        );
      }
      // "invalid" falls through to a full logout.
    }
    setToken(null);
    setRefreshToken(null);
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    throw new ApiError("인증이 만료되었습니다.", 401);
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message = extractMessage(json) ?? `요청 실패 (${res.status})`;
    throw new ApiError(message, res.status);
  }

  // The API returns HTTP 200 even on logical errors: { code: "error", message }.
  if (isErrorEnvelope(json)) {
    throw new ApiError(
      extractMessage(json) ?? "요청을 처리하지 못했습니다.",
      res.status,
      "error",
    );
  }

  return json as T;
}

function isErrorEnvelope(json: unknown): boolean {
  return (
    typeof json === "object" &&
    json !== null &&
    (json as { code?: unknown }).code === "error"
  );
}

function extractMessage(json: unknown): string | undefined {
  if (typeof json === "object" && json !== null) {
    const obj = json as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
  }
  return undefined;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    request<T>("GET", path, { query, signal }),
  post: <T>(path: string, body?: unknown) =>
    request<T>("POST", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
  del: <T>(path: string, body?: unknown) =>
    request<T>("DELETE", path, { body }),
};
