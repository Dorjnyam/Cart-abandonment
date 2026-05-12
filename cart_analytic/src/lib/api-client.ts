import { API_BASE_URL, API_ENDPOINTS, getApiConfig } from "@/lib/api-config";
import { API_TIMEOUT_MS } from "@/lib/constants";
import { toastBridge } from "@/lib/toastBridge";

export function isMockFallback(): boolean {
  // Mock fallback нь зөвхөн frontend development-д зориулагдсан.
  // Normal thesis/demo mode-д fake өгөгдлийг бодит мэт харуулахгүй.
  return process.env.NEXT_PUBLIC_MOCK_FALLBACK === "true";
}

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]!)) as { exp?: number };
    return (payload.exp ?? 0) * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

function updateStoredToken(newToken: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("access_token", newToken);
    const raw = localStorage.getItem("cart_analytic_ui_session");
    if (raw) {
      const session = JSON.parse(raw) as Record<string, unknown>;
      session.token = newToken;
      localStorage.setItem("cart_analytic_ui_session", JSON.stringify(session));
    }
  } catch {}
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const refresh = localStorage.getItem("refresh_token");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { access: string };
    localStorage.setItem("access_token", data.access);
    return data.access;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return;
  const refresh = localStorage.getItem("refresh_token");
  if (refresh) {
    await fetch(`${API_BASE_URL}${API_ENDPOINTS.logout}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    }).catch(() => {});
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("cart_analytic_ui_session");
}

function buildHeaders(token?: string, extraHeaders?: HeadersInit): Headers {
  const headers = new Headers(extraHeaders);
  headers.set("Content-Type", "application/json");
  const cfg = getApiConfig();
  const jwt = token ?? cfg.jwtToken;
  if ((cfg.authMode === "jwt" || cfg.authMode === "both") && jwt) {
    headers.set("Authorization", `Bearer ${jwt}`);
  }
  if ((cfg.authMode === "api-key" || cfg.authMode === "both") && cfg.apiKey) {
    headers.set("X-API-Key", cfg.apiKey);
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const cfg = getApiConfig();
  if (!cfg.baseUrl) {
    throw new ApiError("NEXT_PUBLIC_API_URL is not configured.", 500, "MISSING_API_URL");
  }

  const url = `${cfg.baseUrl}${path}`;

  // Token хугацаа дуусах гэж байвал API хүсэлтээс өмнө шинэчилнэ.
  let currentToken = cfg.jwtToken;
  if (currentToken && isTokenExpired(currentToken)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      updateStoredToken(refreshed);
      currentToken = refreshed;
    } else {
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
    }
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(url, {
      ...init,
      headers: buildHeaders(currentToken, init?.headers),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      toastBridge.show("Серверийн хариу удаж байна", "error");
      throw new ApiError("Request timed out", 0, "TIMEOUT", error);
    }
    toastBridge.show("Сервертэй холбогдоход алдаа гарлаа", "error");
    throw new ApiError("Network error while contacting API.", 0, "NETWORK_ERROR", error);
  }

  // 401 үед token нэг удаа шинэчлээд хүсэлтийг дахин оролдоно.
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      updateStoredToken(refreshed);
      try {
        response = await fetchWithTimeout(url, {
          ...init,
          headers: buildHeaders(refreshed, init?.headers),
        });
      } catch {
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
      }
    } else {
      if (typeof window !== "undefined") window.location.href = "/login";
      throw new ApiError("Session expired", 401, "SESSION_EXPIRED");
    }
  }

  if (response.status === 403) {
    toastBridge.show("Хандах эрх байхгүй", "error");
  } else if (response.status >= 500) {
    toastBridge.show("Серверийн алдаа. Дараа дахин оролдоно уу.", "error");
  }

  // 204 No Content үед parse хийх body байхгүй.
  if (response.status === 204) {
    return null as unknown as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message: string }).message)
        : `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, "HTTP_ERROR", payload);
  }

  return payload as T;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return apiRequest<T>(path);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return apiRequest<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T = null>(path: string): Promise<T> {
    return apiRequest<T>(path, { method: "DELETE" });
  },
};
