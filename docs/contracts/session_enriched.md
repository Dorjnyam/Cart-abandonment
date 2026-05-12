# session_enriched contract

## Purpose

`session_enriched` нь raw events-ийг session түвшний state, counters, metadata болгон нэгтгэсэн Kafka message юм.

## Producer / Consumer

| Producer | Consumer |
|---|---|
| Session service | Feature service |

## Topic

`session_enriched`

## Required fields

```json
{
  "session_id": "ab892586-560d-5dcd-9bff-59751b8bbf79",
  "visitor_id": "visitor_audit_uc1",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "started_at": "2026-05-08T00:00:00Z",
  "session_state": "ABANDONED",
  "has_purchase_success": false,
  "has_checkout_start": true,
  "has_cart_activity": true,
  "final_event_type": "abandon_checkout",
  "event_sequence": ["page_view", "product_view", "add_to_cart"]
}
```

## Validation rules

- `purchase_success` эсвэл `order_success` байвал `session_state=CONVERTED`.
- `CONVERTED` нь terminal төлөв; timeout дараа `ABANDONED` болгож болохгүй.
- `has_purchase_success`, `has_checkout_start`, `has_cart_activity` нь ML feature биш, business metadata.

## Failure behavior

Redis flush race-ээс хамгаалахын тулд flush lock ашиглана. DB write эхэлж хийгдэнэ, дараа нь Kafka publish хийгдэнэ.

## Related tests

- `session/session/tests`
- `scripts/audit/e2e_three_use_cases.py`
