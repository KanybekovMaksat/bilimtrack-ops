/**
 * Client for the Bilimtrack backend (bilimtrack_v2_back).
 *
 * Backend conventions this relies on:
 * - JSON is camelCase both ways (djangorestframework-camel-case);
 * - success bodies are wrapped: `{ data }`, paginated lists `{ data: [], meta: { count, next, previous } }`;
 * - errors follow drf-standardized-errors: `{ type, errors: [{ code, detail, attr }] }`;
 * - auth is SimpleJWT: `auth/login/` returns `{ access, refresh? }` and also sets HttpOnly cookies,
 *   `auth/refresh/` accepts the refresh token in the body or reads it from the cookie.
 */

export const API_URL = (import.meta.env.VITE_API_URL || "/api/v1").replace(/\/$/, "");
export const HEALTH_URL = import.meta.env.VITE_HEALTH_URL || "/health/";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, message: string, code = "") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type Tokens = { access: string; refresh?: string };

const TOKENS_KEY = "bilimtrack-ops.tokens";

function readTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as Tokens) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens | null) {
  try {
    if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    else localStorage.removeItem(TOKENS_KEY);
  } catch {
    // Storage unavailable: the HttpOnly cookies set by the backend still keep the session.
  }
}

let onUnauthorized: () => void = () => {};

/** Called once when the session cannot be refreshed any more (sign the user out). */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    const first = body?.errors?.[0];
    if (first) {
      const field = first.attr ? `${first.attr}: ` : "";
      return new ApiError(res.status, `${field}${first.detail}`, first.code ?? "");
    }
    if (body?.detail) return new ApiError(res.status, String(body.detail));
  } catch {
    // Non-JSON error body (proxy / gateway page).
  }
  return new ApiError(res.status, `Сервер ответил ${res.status} ${res.statusText}`.trim());
}

let refreshing: Promise<boolean> | null = null;

/** One refresh at a time; concurrent 401s wait for the same attempt. */
function refreshTokens(): Promise<boolean> {
  refreshing ??= (async () => {
    const current = readTokens();
    try {
      const res = await fetch(`${API_URL}/auth/refresh/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(current?.refresh ? { refresh: current.refresh } : {}),
      });
      if (!res.ok) return false;
      const { data } = await res.json();
      saveTokens({ access: data.access, refresh: data.refresh ?? current?.refresh });
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skip the Authorization header and the refresh-on-401 retry (login itself). */
  anonymous?: boolean;
};

async function send(path: string, opts: RequestOptions, retry: boolean): Promise<Response> {
  const url = new URL(`${API_URL}/${path.replace(/^\//, "")}`, window.location.origin);
  for (const [k, v] of Object.entries(opts.query ?? {})) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const tokens = opts.anonymous ? null : readTokens();
  if (tokens?.access) headers.Authorization = `Bearer ${tokens.access}`;

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    credentials: "include",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && retry && !opts.anonymous) {
    if (await refreshTokens()) return send(path, opts, false);
    saveTokens(null);
    onUnauthorized();
  }
  return res;
}

/** Performs a request and unwraps the `{ data }` envelope. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res: Response;
  try {
    res = await send(path, opts, true);
  } catch {
    throw new ApiError(0, "Нет связи с сервером. Проверьте интернет или адрес API.");
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  return (body && typeof body === "object" && "data" in body ? body.data : body) as T;
}

/**
 * Fetches a paginated list in one page of up to 500 rows (backend cap is 1000).
 * The list endpoints used here have no server-side filters yet, so screens filter on the client.
 */
export async function apiList<T>(path: string, query: RequestOptions["query"] = {}): Promise<T[]> {
  return api<T[]>(path, { query: { page_size: 500, ...query } });
}

export type Page<T> = { rows: T[]; count: number };

/** One page of a paginated list, keeping the total from `meta.count`. */
export async function apiPage<T>(path: string, query: RequestOptions["query"] = {}): Promise<Page<T>> {
  let res: Response;
  try {
    res = await send(path, { query }, true);
  } catch {
    throw new ApiError(0, "Нет связи с сервером. Проверьте интернет или адрес API.");
  }
  if (!res.ok) throw await parseError(res);
  const body = await res.json();
  const rows = (body?.data ?? []) as T[];
  return { rows, count: body?.meta?.count ?? rows.length };
}
