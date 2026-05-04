"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api-config";

export type UserRole = "admin" | "owner" | "member" | "developer";

type SessionState = {
  userName: string;
  role: UserRole;
  storeName: string;
  userId: string;
  token: string | null;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  setSession: (s: {
    token: string;
    role: UserRole;
    userName: string;
    storeName?: string;
    userId?: string;
  }) => void;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const STORAGE_KEY = "cart_analytic_ui_session";

const AuthContext = createContext<SessionState | null>(null);

type StoredSession = {
  role?: UserRole;
  userName?: string;
  storeName?: string;
  userId?: string;
  token?: string;
};

function readStored(): StoredSession {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as StoredSession;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StoredSession>(readStored);

  const persistSession = useCallback((next: StoredSession) => {
    setSessionState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      role: session.role ?? "owner",
      userName: session.userName ?? "Хэрэглэгч",
      storeName: session.storeName ?? "Central Market",
      userId: session.userId ?? "",
      token: session.token ?? null,
      isAuthenticated: Boolean(session.token || session.role),

      setRole: (nextRole) => {
        persistSession({ ...session, role: nextRole });
      },

      setSession: ({ token, role, userName, storeName, userId }) => {
        const next: StoredSession = {
          token,
          role,
          userName,
          storeName: storeName ?? "Central Market",
          userId: userId ?? "",
        };
        persistSession(next);
      },

      login: async (email: string, password: string) => {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({})) as { detail?: string };
          throw new Error(err.detail ?? "Нэвтрэх мэдээлэл буруу байна");
        }

        const data = await response.json() as {
          access: string;
          refresh?: string;
          user?: { id?: string; email?: string; role?: string; store_name?: string };
        };

        localStorage.setItem("access_token", data.access);
        if (data.refresh) localStorage.setItem("refresh_token", data.refresh);

        const next: StoredSession = {
          token: data.access,
          role: (data.user?.role as UserRole) ?? "owner",
          userName: data.user?.email?.split("@")[0] ?? email.split("@")[0] ?? "Хэрэглэгч",
          storeName: data.user?.store_name ?? "Central Market",
          userId: data.user?.id ?? "",
        };
        persistSession(next);
      },

      signOut: () => {
        const refresh = localStorage.getItem("refresh_token");
        if (refresh) {
          fetch(`${API_BASE_URL}${API_ENDPOINTS.logout}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh }),
          }).catch(() => {});
        }
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem(STORAGE_KEY);
        window.location.href = "/login";
      },
    }),
    [session, persistSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
