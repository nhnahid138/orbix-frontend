const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
let accessToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;
let refreshedUser: { id: number; name: string; email: string; phoneNumber?: string | null; role: "customer" | "admin" } | null = null;

export type ApiError = Error & { status: number; details?: unknown };

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function apiUrl(path: string) {
  return `${API_URL}/api/v1${path.startsWith("/") ? path : `/${path}`}`;
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(apiUrl("/auth/refresh"), { method: "POST", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) return false;
        const data = await response.json();
        accessToken = data.accessToken;
        refreshedUser = data.user;
        return true;
      })
      .catch(() => false)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function api<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(apiUrl(path), { ...options, headers, credentials: "include" });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    if (await refreshAccessToken()) return api<T>(path, options, false);
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = Array.isArray(payload?.message) ? payload.message.join(" · ") : payload?.message;
    const error = new Error(message || `Request failed (${response.status})`) as ApiError;
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function initializeSession() {
  const restored = await refreshAccessToken();
  if (!restored) return null;
  return refreshedUser;
}

export function formatMoney(minor: number | string, currency = "BDT") {
  const amount = Number(minor) / 100;
  return new Intl.NumberFormat("en-BD", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
