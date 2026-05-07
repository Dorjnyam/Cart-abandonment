"use client";

import { useMemo, useState } from "react";

type DemoStatus = {
  eventType: string;
  status: "pending" | "sent" | "failed";
  detail?: string;
};
type EventExtras = Record<string, unknown>;
type EventTuple = readonly [eventType: string, extras: EventExtras];

const OBSERVER_URL = process.env.NEXT_PUBLIC_OBSERVER_URL?.trim() || "http://localhost:8001";
const OBSERVER_KEY = process.env.NEXT_PUBLIC_OBSERVER_SNIPPET_KEY?.trim() || "tk_full_demo_mvp";
const TENANT_ID = "00000000-0000-0000-0000-000000000001";

function newSessionId(kind: "abandoned" | "converted") {
  return `thesis-${kind}-${Date.now()}`;
}

function buildEvent(sessionId: string, visitorId: string, eventType: string, index: number, extras: EventExtras) {
  return {
    api_key: OBSERVER_KEY,
    event_id: `${sessionId}-${index}-${eventType}`,
    visitor_id: visitorId,
    session_id: sessionId,
    tenant_id: TENANT_ID,
    event_type: eventType,
    timestamp: new Date(Date.now() + index * 250).toISOString(),
    url: `${window.location.origin}/thesis-demo`,
    path: "/thesis-demo",
    referrer: "https://instagram.com/thesis-demo",
    device_type: "mobile",
    language: "mn",
    timezone: "Asia/Irkutsk",
    product_id: "demo-sneaker-001",
    product_price: 249000,
    product_category: "fashion",
    product_availability: "in_stock",
    cart_value: 249000,
    cart_item_count: 1,
    page_load_ms: 3100,
    time_on_page_sec: 80 + index * 15,
    max_scroll_pct: 72,
    click_count: 6 + index,
    active_time_ms: 45000 + index * 2500,
    is_mobile: true,
    ...extras,
  };
}

function eventSequence(kind: "abandoned" | "converted", sessionId: string, visitorId: string) {
  const common: EventTuple[] = [
    ["page_view", { detected_page_type: "home", page_view_count: 1 }],
    ["product_view", { detected_page_type: "product", page_view_count: 2, dist_product_count: 2 }],
    ["add_to_cart", { action_detected: "cart_add", selected_quantity: 1, commitment_depth: 0.55 }],
    ["cart_view", { detected_page_type: "cart", cart_churn_count: kind === "abandoned" ? 2 : 0 }],
    ["checkout_start", { detected_page_type: "checkout", checkout_step: 1, checkout_step_detected: 1 }],
  ];

  if (kind === "converted") {
    const sequence: EventTuple[] = [
      ...common,
      ["purchase_success", { is_order_success: true, order_total: 249000, payment_method: "qpay", end_reason: "purchase" }],
    ];
    return sequence.map(([eventType, extras], index) => buildEvent(sessionId, visitorId, eventType, index, extras));
  }

  const sequence: EventTuple[] = [
    ...common,
    ["checkout_error", { js_error: 1, rage_click: 2, payment_method: "card", price_hesitation_score: 0.72 }],
    ["abandon_checkout", { cart_churn_count: 3, tab_hidden_count: 3, back_navigation: 2, end_reason: "unload" }],
    ["beforeunload", { cart_churn_count: 3, tab_hidden_count: 3, is_order_success: false, end_reason: "unload" }],
  ];
  return sequence.map(([eventType, extras], index) => buildEvent(sessionId, visitorId, eventType, index, extras));
}

export default function ThesisDemoPanel() {
  const [sessionId, setSessionId] = useState("");
  const [statuses, setStatuses] = useState<DemoStatus[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const dashboardHint = useMemo(() => sessionId ? `Use this session_id in the analytics dashboard: ${sessionId}` : "", [sessionId]);

  async function run(kind: "abandoned" | "converted") {
    const sid = newSessionId(kind);
    const visitorId = `visitor-${sid}`;
    const events = eventSequence(kind, sid, visitorId);
    setSessionId(sid);
    setPreview(events[events.length - 1] ?? null);
    setStatuses(events.map((event) => ({ eventType: String(event.event_type), status: "pending" })));
    setBusy(true);

    const next: DemoStatus[] = [];
    for (const event of events) {
      try {
        const response = await fetch(`${OBSERVER_URL}/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": OBSERVER_KEY,
          },
          body: JSON.stringify(event),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        next.push({ eventType: String(event.event_type), status: "sent" });
      } catch (error) {
        next.push({ eventType: String(event.event_type), status: "failed", detail: error instanceof Error ? error.message : "send failed" });
      }
      setStatuses([...next, ...events.slice(next.length).map((item) => ({ eventType: String(item.event_type), status: "pending" as const }))]);
    }
    setBusy(false);
  }

  function clearState() {
    setSessionId("");
    setStatuses([]);
    setPreview(null);
  }

  return (
    <section className="mt-8 border border-[#c8f135]/40 bg-zinc-950 p-4 text-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-brand text-lg font-bold uppercase text-[#c8f135]">Thesis Demo Mode</p>
          <p className="text-zinc-300">Generate deterministic cart abandonment or conversion events for the MVP pipeline.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => run("abandoned")} className="btn-primary px-4 py-2 text-xs">Generate abandoned session</button>
          <button disabled={busy} onClick={() => run("converted")} className="btn-secondary px-4 py-2 text-xs">Generate converted session</button>
          <button disabled={busy} onClick={clearState} className="btn-secondary px-4 py-2 text-xs">Clear demo state</button>
        </div>
      </div>
      {sessionId ? <p className="mt-3 font-mono text-xs text-zinc-200">{dashboardHint}</p> : null}
      {statuses.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-4">
          {statuses.map((item, index) => (
            <div key={`${item.eventType}-${index}`} className="border border-zinc-800 px-3 py-2">
              <p className="font-mono text-xs">{item.eventType}</p>
              <p className={item.status === "sent" ? "text-green-400" : item.status === "failed" ? "text-red-400" : "text-zinc-400"}>
                {item.status}{item.detail ? `: ${item.detail}` : ""}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {preview ? (
        <pre className="mt-3 max-h-44 overflow-auto border border-zinc-800 bg-black p-3 text-xs text-zinc-300">
          {JSON.stringify(preview, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
