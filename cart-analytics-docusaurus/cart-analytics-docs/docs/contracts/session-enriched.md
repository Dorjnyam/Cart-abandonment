---
title: session_enriched
---

# session_enriched

Producer: Session service. Consumer: Feature service.

```json
{
  "session_id": "ab892586-560d-5dcd-9bff-59751b8bbf79",
  "session_state": "CONVERTED",
  "has_purchase_success": true,
  "has_checkout_start": true,
  "has_cart_activity": true,
  "final_event_type": "purchase_success"
}
```

State rules:

- NEW -> ACTIVE: session дээр event хуримтлагдана.
- ACTIVE -> CONVERTED: `purchase_success` эсвэл `order_success`.
- ACTIVE -> ABANDONED: idle timeout ба converted биш үед.
- CONVERTED нь terminal төлөв.
