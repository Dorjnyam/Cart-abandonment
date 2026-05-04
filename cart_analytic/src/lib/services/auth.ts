import { ApiError } from "@/lib/api-client";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";
import type { UserRole } from "@/components/editorial/AuthContext";

export type AuthSession = {
  token: string;
  refresh?: string;
  role: UserRole;
  userName: string;
  storeName: string;
  userId: string;
};

export async function loginWithCredentials(
  email: string,
  password: string,
  role: UserRole,
): Promise<AuthSession> {
  if (!API_BASE_URL) {
    if (!email || password.length < 4) {
      throw new ApiError("Нэвтрэх мэдээлэл буруу байна", 401, "AUTH_ERROR");
    }
    if (email.includes("suspended")) {
      throw new ApiError("Таны эрх түр хаагдсан байна. Админтай холбогдоно уу.", 403, "SUSPENDED");
    }
    return {
      token: `demo_${Date.now()}`,
      role,
      userName: email.split("@")[0] || "Хэрэглэгч",
      storeName: "Central Market",
      userId: "demo_user",
    };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    throw new ApiError("Сүлжээний алдаа. Дахин оролдоно уу.", 0, "NETWORK_ERROR", err);
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({})) as { detail?: string };
    throw new ApiError(
      err.detail ?? "Нэвтрэх мэдээлэл буруу байна",
      response.status,
      "AUTH_ERROR",
    );
  }

  const data = await response.json() as {
    access: string;
    refresh?: string;
    user?: { id?: string; email?: string; role?: string; store_name?: string };
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", data.access);
    if (data.refresh) localStorage.setItem("refresh_token", data.refresh);
  }

  return {
    token: data.access,
    refresh: data.refresh,
    role: (data.user?.role as UserRole) ?? role,
    userName: data.user?.email?.split("@")[0] ?? email.split("@")[0] ?? "Хэрэглэгч",
    storeName: data.user?.store_name ?? "Central Market",
    userId: data.user?.id ?? "unknown",
  };
}

export async function refreshAccessToken(refresh: string): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.refresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!response.ok) return null;
    const data = await response.json() as { access: string };
    return data.access;
  } catch {
    return null;
  }
}
