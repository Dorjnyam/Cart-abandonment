export const OBSERVER_URL =
  process.env.NEXT_PUBLIC_OBSERVER_URL?.trim() || "http://localhost:8001";

export const OBSERVER_SNIPPET_KEY =
  process.env.NEXT_PUBLIC_OBSERVER_SNIPPET_KEY?.trim() || "tk_full_demo_mvp";

export const OBSERVER_TENANT_ID =
  process.env.NEXT_PUBLIC_OBSERVER_TENANT_ID?.trim() ||
  "00000000-0000-0000-0000-000000000001";

declare global {
  interface Window {
    __OBSERVER_BASE__?: string;
    __OBSERVER_API_KEY__?: string;
    __OBSERVER_TENANT_ID__?: string;
  }
}

function runtimeValue(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

export function getRuntimeObserverConfig() {
  if (typeof window === "undefined") {
    return {
      url: OBSERVER_URL,
      snippetKey: OBSERVER_SNIPPET_KEY,
      tenantId: OBSERVER_TENANT_ID,
    };
  }

  return {
    url: runtimeValue(window.__OBSERVER_BASE__, OBSERVER_URL),
    snippetKey: runtimeValue(window.__OBSERVER_API_KEY__, OBSERVER_SNIPPET_KEY),
    tenantId: runtimeValue(window.__OBSERVER_TENANT_ID__, OBSERVER_TENANT_ID),
  };
}
