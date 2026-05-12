---
title: raw_events
---

# raw_events

Producer: Observer service. Consumer: Session service.

```json
{
  "session_id": "audit_uc1_abandoned_technical",
  "visitor_id": "visitor_audit_uc1",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "event_type": "checkout_error",
  "checkout_step": 3,
  "error_type": "payment_failed",
  "rage_click": 4,
  "js_error": 2
}
```

Required fields: `session_id`, `visitor_id`, `tenant_id`, `event_type`, `timestamp`.

Commerce evidence fields: `product_id`, `product_name`, `category`, `price`, `quantity`, `cart_total`, `discount`, `shipping_cost`, `checkout_step`, `error_type`, `payment_method`, `order_id`.

Invalid API key бол DB write хийхээс өмнө reject хийнэ.
