# raw_events contract

## Purpose

`raw_events` нь Observer service-ийн эхний хадгалалт ба Kafka message contract юм. Энэ contract нь audit evidence талбаруудыг downstream service-үүдэд алдалгүй дамжуулах үүрэгтэй.

## Producer / Consumer

| Producer | Consumer |
|---|---|
| Observer service `/track` | Session service `raw_events` consumer |

## Topic / Store

- PostgreSQL: `raw_events`
- Kafka topic: `raw_events`

## Required fields

```json
{
  "event_id": "audit_uc1-00-page_view",
  "session_id": "audit_uc1_abandoned_technical",
  "visitor_id": "visitor_audit_uc1",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "event_type": "checkout_error",
  "timestamp": "2026-05-08T00:00:00Z"
}
```

## Optional commerce fields

`product_id`, `product_name`, `category`, `price`, `quantity`, `cart_total`, `discount`, `shipping_cost`, `checkout_step`, `error_type`, `payment_method`, `order_id`.

## Validation rules

- Invalid API key бол DB write хийхээс өмнө reject хийнэ.
- Forbidden secret-like fields хадгалагдахгүй.
- T1/full key дээр unknown extra fields JSONB-д хадгалагдаж болно.

## Failure behavior

PostgreSQL write failure бол `/track` алдаа буцаана. Kafka unavailable бол Observer log бичээд request-г амжилттай дуусгаж болно, учир нь DB evidence authoritative store хэвээр байна.

## Related tests

- `observer_experiment/tests/test_ingest.py`
- `scripts/audit/e2e_three_use_cases.py`
