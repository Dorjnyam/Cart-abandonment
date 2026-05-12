"use client";

import { useMemo, useState } from "react";
import { getRuntimeObserverConfig } from "@/lib/observer-config";

type UseCaseKind = "technical" | "converted" | "price_sensitive";

type DemoStatus = {
  eventType: string;
  status: "pending" | "sent" | "failed";
  detail?: string;
};

type EventExtras = Record<string, unknown>;
type EventTuple = readonly [eventType: string, extras: EventExtras];

function newSessionId(kind: UseCaseKind) {
  return `thesis-${kind}-${Date.now()}`;
}

function buildEvent(
  sessionId: string,
  visitorId: string,
  eventType: string,
  index: number,
  extras: EventExtras,
  observer: ReturnType<typeof getRuntimeObserverConfig>,
) {
  return {
    api_key: observer.snippetKey,
    event_id: `${sessionId}-${index}-${eventType}`,
    visitor_id: visitorId,
    session_id: sessionId,
    tenant_id: observer.tenantId,
    event_type: eventType,
    timestamp: new Date(Date.now() + index * 250).toISOString(),
    url: `${window.location.origin}/thesis-demo`,
    path: "/thesis-demo",
    page_url: `${window.location.origin}/thesis-demo`,
    referrer: "https://instagram.com/thesis-demo",
    device_type: "mobile",
    language: "mn",
    timezone: "Asia/Irkutsk",
    product_id: "demo-sneaker-001",
    product_name: "Demo Runner",
    category: "sneakers",
    price: 249000,
    quantity: 1,
    product_price: 249000,
    product_category: "sneakers",
    product_availability: "in_stock",
    cart_total: 249000,
    cart_value: 249000,
    cart_item_count: 1,
    page_load_ms: 2200,
    time_on_page_sec: 45 + index * 10,
    max_scroll_pct: 72,
    click_count: 4 + index,
    active_time_ms: 30000 + index * 1000,
    is_logged_in: false,
    ...extras,
  };
}

function demoUseCaseSequence(kind: UseCaseKind): EventTuple[] {
  if (kind === "converted") {
    // UC2: purchase_success нь converted terminal төлөв тул abandoned diagnosis/recommendation үүсгэхгүй.
    return [
      ["page_view", { device_type: "desktop", referrer: "http://localhost:3000", page_view_count: 1 }],
      ["product_view", { device_type: "desktop", referrer: "http://localhost:3000", page_view_count: 2 }],
      ["add_to_cart", { device_type: "desktop", referrer: "http://localhost:3000", action_detected: "cart_add" }],
      ["cart_view", { device_type: "desktop", referrer: "http://localhost:3000" }],
      [
        "checkout_start",
        {
          device_type: "desktop",
          referrer: "http://localhost:3000",
          checkout_step: 2,
          checkout_step_detected: 2,
          form_fields_count: 6,
          form_fields_touched: 6,
        },
      ],
      [
        "purchase_success",
        {
          device_type: "desktop",
          referrer: "http://localhost:3000",
          is_order_success: true,
          order_id: "demo-order-uc2",
          payment_method: "qpay",
          cart_total: 249000,
          end_reason: "purchase",
        },
      ],
    ];
  }

  if (kind === "price_sensitive") {
    // UC3: өндөр cart_total, shipping_cost, coupon failure нь S5 Price sensitivity-г давамгай болгох evidence.
    return [
      ["page_view", { device_type: "desktop", cart_total: 820000 }],
      ["product_view", { device_type: "desktop", cart_total: 820000, price: 410000, product_price: 410000 }],
      ["add_to_cart", { device_type: "desktop", cart_total: 820000 }],
      [
        "cart_view",
        { device_type: "desktop", cart_total: 820000, shipping_cost: 70000, discount: 0, copy_count: 1, tab_hidden_ms: 9000 },
      ],
      [
        "checkout_start",
        {
          device_type: "desktop",
          cart_total: 890000,
          shipping_cost: 70000,
          checkout_step: 1,
          checkout_step_detected: 1,
          coupon_entered: true,
          discount_code: "FAILED",
          discount: 0,
          outbound_click: 1,
        },
      ],
      [
        "cart_view",
        { device_type: "desktop", cart_total: 890000, shipping_cost: 70000, cart_churn_count: 2, copy_count: 1, tab_hidden_ms: 9000 },
      ],
      [
        "checkout_start",
        {
          device_type: "desktop",
          cart_total: 890000,
          shipping_cost: 70000,
          checkout_step: 1,
          checkout_step_detected: 1,
          coupon_entered: true,
          discount_code: "FAILED",
          discount: 0,
          outbound_click: 1,
        },
      ],
      ["abandon_checkout", { device_type: "desktop", cart_total: 890000, shipping_cost: 70000, cart_churn_count: 3, end_reason: "unload" }],
    ];
  }

  // UC1: mobile checkout алдаа, rage_click, js_error, slow page load нь S2 Technical friction-г хүчтэй болгоно.
  return [
    ["page_view", { device_type: "mobile", page_view_count: 1 }],
    ["product_view", { device_type: "mobile", page_view_count: 2 }],
    ["add_to_cart", { action_detected: "cart_add" }],
    ["cart_view", { cart_churn_count: 1 }],
    ["checkout_start", { checkout_step: 2, checkout_step_detected: 2, form_fields_count: 8, form_fields_touched: 2 }],
    ["checkout_error", { checkout_step: 3, checkout_step_detected: 3, error_type: "payment_failed", payment_method: "card", rage_click: 4, js_error: 2, page_load_ms: 7600 }],
    ["checkout_error", { checkout_step: 3, checkout_step_detected: 3, error_type: "validation_error", rage_click: 5, js_error: 1, back_navigation: 2, scroll_up_count: 8 }],
    ["abandon_checkout", { end_reason: "unload", cart_churn_count: 3, tab_hidden_count: 3 }],
  ];
}

function eventSequence(
  kind: UseCaseKind,
  sessionId: string,
  visitorId: string,
  observer: ReturnType<typeof getRuntimeObserverConfig>,
) {
  return demoUseCaseSequence(kind).map(([eventType, extras], index) =>
    buildEvent(sessionId, visitorId, eventType, index, extras, observer),
  );
}

export default function ThesisDemoPanel() {
  const [sessionId, setSessionId] = useState("");
  const [statuses, setStatuses] = useState<DemoStatus[]>([]);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  const dashboardHint = useMemo(
    () => (sessionId ? `Dashboard дээр шалгах Session ID: ${sessionId}` : ""),
    [sessionId],
  );

  async function run(kind: UseCaseKind) {
    const observer = getRuntimeObserverConfig();
    const sid = newSessionId(kind);
    const visitorId = `visitor-${sid}`;
    const events = eventSequence(kind, sid, visitorId, observer);
    setSessionId(sid);
    setPreview(events[events.length - 1] ?? null);
    setStatuses(events.map((event) => ({ eventType: String(event.event_type), status: "pending" })));
    setBusy(true);

    const next: DemoStatus[] = [];
    for (const event of events) {
      try {
        const response = await fetch(`${observer.url}/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": observer.snippetKey,
          },
          body: JSON.stringify(event),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        next.push({ eventType: String(event.event_type), status: "sent" });
      } catch (error) {
        next.push({
          eventType: String(event.event_type),
          status: "failed",
          detail: error instanceof Error ? error.message : "send failed",
        });
      }
      setStatuses([
        ...next,
        ...events.slice(next.length).map((item) => ({
          eventType: String(item.event_type),
          status: "pending" as const,
        })),
      ]);
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
          <p className="font-brand text-lg font-bold uppercase text-[#c8f135]">Дипломын demo горим</p>
          <p className="text-zinc-300">UC1, UC2, UC3 баталгаажуулах deterministic event sequence илгээнэ.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => run("technical")} className="btn-primary px-4 py-2 text-xs">Орхигдсон сесс үүсгэх</button>
          <button disabled={busy} onClick={() => run("converted")} className="btn-secondary px-4 py-2 text-xs">Амжилттай худалдан авалт үүсгэх</button>
          <button disabled={busy} onClick={() => run("price_sensitive")} className="btn-secondary px-4 py-2 text-xs">Үнийн мэдрэмжтэй орхилт үүсгэх</button>
          <button disabled={busy} onClick={clearState} className="btn-secondary px-4 py-2 text-xs">Цэвэрлэх</button>
        </div>
      </div>
      {sessionId ? <p className="mt-3 font-mono text-xs text-zinc-200">Session ID: {dashboardHint}</p> : null}
      {statuses.length ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Илгээсэн үйлдлүүд</p>
          <div className="grid gap-2 md:grid-cols-4">
            {statuses.map((item, index) => (
              <div key={`${item.eventType}-${index}`} className="border border-zinc-800 px-3 py-2">
                <p className="font-mono text-xs">{item.eventType}</p>
                <p className={item.status === "sent" ? "text-green-400" : item.status === "failed" ? "text-red-400" : "text-zinc-400"}>
                  {item.status}{item.detail ? `: ${item.detail}` : ""}
                </p>
              </div>
            ))}
          </div>
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
