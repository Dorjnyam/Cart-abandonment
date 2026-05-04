---
sidebar_position: 2
title: Event төрлүүд
---

# Event төрлүүд (`event_type`)

`raw_events.event_type` талбар — ямар үйл явдал бүртгэгдснийг заана. Viewer-ийн шүүлтүүр болон `/events?event_type=...` query-тай нийцнэ.

---

## Автомат event-үүд (snippet илгээнэ)

Эдгээр event-ийг track.js **автоматаар** тодорхой нөхцөлд илгээнэ — сайт дээр нэмэлт код шаардагдахгүй.

| `event_type` | Tier | Гарах нөхцөл |
|--------------|------|--------------|
| `page_view` | T3+ | Snippet ачаалагдаж дуусмагц, хуудас бүр |
| `heartbeat` | T3+ | ~30 секунд тутамд, хуудас нээлттэй байх үед |
| `session_end` | T3+ | `beforeunload` — хуудасаас гарах үед (илгээлт 100% баталгаагүй) |
| `tab_hidden` | T3+ | Хэрэглэгч өөр таб руу шилжих (`visibilitychange`) |
| `tab_visible` | T3+ | Хэрэглэгч буцаж энэ таб руу шилжих |
| `idle_start` | T3+ | 30 секундэд хөдөлгөөн байхгүй бол |
| `idle_end` | T3+ | Idle дуусч хэрэглэгч идэвхжих |
| `copy` | T3+ | Текст copy хийх (`Ctrl+C` / сонгон copy) |
| `paste` | T3+ | Текст paste хийх |
| `search` | T3+ | Хайлтын form submit |

---

## T2+ автомат event-үүд

T2 (`tk_smart_*`) болон T1 (`tk_full_*`) түлхүүрт **нэмэлтээр** идэвхждэг.

| `event_type` | Tier | Гарах нөхцөл |
|--------------|------|--------------|
| `rage_click` | T2+ | ~350ms дотор 3+ удаа ойролцоо цэгт дарах |
| `js_error` | T2+ | `window.onerror` эсвэл `unhandledrejection` |
| `outbound_click` | T2+ | Гадаад домайн руу шилжих `<a>` дарах |
| `product_impression` | T2+ | Бараа эхний удаа viewport-д орж ирэх (IntersectionObserver) |
| `popup_open` | T2+ | Modal/dialog анх харагдах |
| `purchase` | T2+ | Order success URL heuristic буюу `sendPurchase()` дуудах |

---

## T1 `data-ca` event-үүд

T1 (`tk_full_*`) түлхүүрт `[data-ca="..."]` attribute бүхий элемент дарахад үүсэнэ. HTML дээр нэмэлт тэмдэглэгдэхүүн шаардлагатай.

| `event_type` | `data-ca` утга | Тайлбар |
|--------------|----------------|---------|
| `cart_add` | `cart_add` | Сагсанд нэмэх |
| `cart_remove` | `cart_remove` | Сагснаас хасах |
| `cart_update_qty` | `cart_update_qty` | Тоо ширхэг өөрчлөх |
| `checkout_start` | `checkout_start` | Checkout эхлэх |
| `select_size` | `select_size` | Хэмжээ сонгох |
| `select_color` | `select_color` | Өнгө сонгох |
| *(custom)* | *(аливаа нэр)* | Өөрийн event нэр тохируулж болно |

---

## Гараар илгээх event-үүд

`window._ca.sendEvent()` функцаар JavaScript-ээс гараар илгээнэ.

```javascript
// Жишээ: wishlist-д нэмэх
window._ca.sendEvent("wishlist_add", {
  product_id: "prod_456",
  product_name: "Adidas Ultraboost 22"
});

// Жишээ: filter ашиглалт
window._ca.sendEvent("filter_apply", {
  filter_name: "size",
  filter_value: "42"
});
```

---

## Event-ийн payload жишээнүүд

### `page_view`

```json
{
  "event_type": "page_view",
  "url": "https://example.mn/products/nike-air-force-1",
  "session_id": "sess_abc",
  "visitor_id": "vis_xyz",
  "tier": "T3",
  "payload": {
    "path": "/products/nike-air-force-1",
    "device_type": "desktop",
    "language": "mn",
    "timezone": "Asia/Ulaanbaatar",
    "referrer": "https://google.com"
  }
}
```

### `heartbeat` (T2 key-тэй)

```json
{
  "event_type": "heartbeat",
  "tier": "T2",
  "payload": {
    "time_on_page_sec": 45,
    "max_scroll_pct": 68,
    "click_count": 3,
    "active_time_ms": 38000,
    "tab_hidden_count": 1,
    "detected_page_type": "product",
    "product_slug": "nike-air-force-1",
    "is_logged_in": false
  }
}
```

### `cart_add` (T1 key-тэй)

```json
{
  "event_type": "cart_add",
  "tier": "T1",
  "payload": {
    "product_id": "prod_001",
    "product_variant": "44 / White",
    "cart_value": 178000,
    "cart_item_count": 2,
    "payment_method": null
  }
}
```

---

## Тэмдэглэл

- `session_end`-ийн **ilgelt 100% баталгаагүй** — хэрэглэгч хөтчийг хаах/эвдрэх үед `beforeunload` дуудагдахгүй байж болно.
- `heartbeat` нь session-ийн **сүүлийн snapshot** — `time_on_page_sec`, `max_scroll_pct` зэрэг нэгтгэсэн утгуудыг агуулна.
- `product_impression` нь `IntersectionObserver` ашиглан **анхны нэг удаа** л тэмдэглэгдэнэ.
