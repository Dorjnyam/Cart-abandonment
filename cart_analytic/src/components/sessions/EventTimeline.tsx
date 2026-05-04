import type { SessionEvent } from "@/types/api";

function isCartEvent(eventType: string) {
  return (
    eventType.includes("cart") ||
    eventType.includes("checkout") ||
    eventType.includes("add_to_cart") ||
    eventType.includes("remove_from_cart")
  );
}

export default function EventTimeline({ events }: { events: SessionEvent[] | null | undefined }) {
  if (!events || events.length === 0) {
    return <div className="text-sm text-on-surface-variant">Event timeline өгөгдөл алга.</div>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.2fr)_1fr_auto_auto] gap-2 sm:gap-3 rounded-lg border border-outline-variant/15 bg-surface-container-low px-3 py-2.5"
        >
          <span className="font-mono text-xs text-on-surface truncate">{event.page_url}</span>
          <span
            className={[
              "text-xs font-semibold",
              isCartEvent(event.event_type) ? "text-error" : "text-on-surface-variant",
            ].join(" ")}
          >
            {event.event_type}
          </span>
          <span className="text-xs text-on-surface-variant whitespace-nowrap">{new Date(event.timestamp).toLocaleString()}</span>
          <span className="text-xs font-semibold text-on-surface text-right tabular-nums">{event.time_on_page}s</span>
        </div>
      ))}
    </div>
  );
}
