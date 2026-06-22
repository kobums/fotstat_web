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
export const UNAUTHORIZED_EVENT = "fotstat:unauthorized";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
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
    setToken(null);
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
