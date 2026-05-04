---
sidebar_position: 4
title: Tier 1 нэмэлт
---

# Tier 1 — Худалдааны нарийн талбарууд

`tk_full_*` угтасаар Tier 2-ын 44 талбар **дээр** доорх 10 нэмэлт талбар хадгалагдана. Нийт: **54 payload талбар**.

**Судалгааны шийдвэр:** Бүх 10 T1 талбарыг хадгалах — ялангуяа `payment_method` нь Монгол e-commerce контекстийн (QPay / SocialPay) итгэлцлийн дохио болдог.

---

## T1 талбарууд

Бүх T1 талбар нь `commerce_explicit` sector-т хамаарах бөгөөд `t1_explicit` эх үүсвэртэй — HTML `data-ca-*` attribute эсвэл `window._ca_user` / `_ca.sendPurchase()`-аар илгээгдэнэ.

| Талбар | Тайлбар | HTML жишээ |
|--------|---------|------------|
| `cart_item_count` | Сагсны мөрийн тоо | `data-ca-count="2"` |
| `cart_value` | Сагсны нийт дүн (төгрөгөөр) | `data-ca-price="178000"` |
| `checkout_step` | Checkout-ын аль алхам дээр байгаа (тодорхой, heuristic биш) | `data-ca="checkout_start"` |
| `discount_code` | Ашигласан хөнгөлөлтийн код | `data-ca-coupon="SALE10"` |
| `is_sale` | `true` — тухайн бараа хямдралтай байгаа эсэх | `data-ca-sale="true"` |
| `order_total` | Захиалгын нийт дүн (суурилгааны дараа) | `sendPurchase()` дотор |
| `payment_method` | Сонгосон төлбөрийн хэрэгсэл | `data-ca-payment="QPay"` |
| `product_stock` | Нөөцийн тэмдэглэл (`"in_stock"`, `"low_stock"`, `"out_of_stock"`) | `data-ca-stock="low_stock"` |
| `product_variant` | SKU / хэмжээ + өнгө (`"44 / White"`) | `data-ca-variant="44 / White"` |
| `shipping_method` | Хүргэлтийн арга (`"standard"`, `"express"`) | `sendPurchase()` дотор |

---

## HTML тэмдэглэгдэхүүн жишээ

### Сагсанд нэмэх товч

```html
<button
  data-ca="cart_add"
  data-ca-id="prod_nike_001"
  data-ca-name="Nike Air Force 1 07"
  data-ca-price="89000"
  data-ca-variant="44 / White"
  data-ca-stock="in_stock"
>
  Сагсанд нэмэх
</button>
```

### Checkout товч

```html
<button data-ca="checkout_start">
  Захиалах ({{ cart_total }} ₮)
</button>
```

### Хэмжээ сонгох

```html
<button data-ca="select_size" data-ca-size="42">42</button>
<button data-ca="select_size" data-ca-size="43">43</button>
<button data-ca="select_size" data-ca-size="44">44</button>
```

---

## `window._ca_user` объект

Нэвтэрсэн хэрэглэгчийн мэдээллийг дамжуулна. **track.js-ийн өмнө** тохируулах шаардлагатай:

```html
<script>
  window._ca_user = {
    is_logged_in: true,
    customer_type: "returning"   // "new" | "returning" | "vip"
  };
</script>
<script src="...track.js?key=tk_full_xxx" defer></script>
```

---

## `sendPurchase()` — Захиалга амжилттай

Order success хуудаст дуудна:

```javascript
// React/Next.js жишээ
useEffect(() => {
  if (orderComplete && window._ca) {
    window._ca.sendPurchase({
      order_total: 178000,
      payment_method: "QPay",      // QPay | SocialPay | card | cash_on_delivery
      cart_item_count: 2,
      discount_code: "SALE10",
      shipping_method: "standard"
    });
  }
}, [orderComplete]);
```

---

## `payment_method` — Монгол контекст

Монгол e-commerce-д түгээмэл утгууд:

| Утга | Тайлбар |
|------|---------|
| `"QPay"` | QPay QR төлбөр |
| `"SocialPay"` | SocialPay (Хаан банк) |
| `"card"` | Банкны карт |
| `"cash_on_delivery"` | Хүргэлтэд төлөх |
| `"installment"` | Хэсэгчлэн төлөх |

Судалгааны таамаглал: QPay/SocialPay ашиглагчид checkout-аас гарах магадлал бага байна (итгэлцэл илүү өндөр).

---

## SQL жишээ

```sql
-- Төлбөрийн аргаар захиалгын дүн
SELECT
  payload->>'payment_method' AS payment,
  COUNT(*) AS orders,
  AVG((payload->>'order_total')::numeric) AS avg_total,
  SUM((payload->>'order_total')::numeric) AS revenue
FROM raw_events
WHERE tier = 'T1'
  AND event_type = 'purchase'
  AND payload->>'payment_method' IS NOT NULL
GROUP BY payment
ORDER BY orders DESC;
```

```sql
-- Сагс орхисон байдал (cart_add авсан ч purchase байхгүй session-ууд)
SELECT s.session_id, s.cart_value
FROM (
  SELECT DISTINCT ON (session_id)
    session_id,
    (payload->>'cart_value')::numeric AS cart_value
  FROM raw_events
  WHERE event_type = 'cart_add' AND tier = 'T1'
  ORDER BY session_id, id DESC
) s
WHERE s.session_id NOT IN (
  SELECT DISTINCT session_id
  FROM raw_events
  WHERE event_type = 'purchase'
);
```

---

## Дараагийн алхам

- [Integration заавар](/docs/integration) — `data-ca-*` бүрэн тохируулах заавар
- [API лавлах](/docs/reference/api) — `/api/field-catalog` live JSON
- [Судалгааны map](/project-docs/research_field_map) — T1 талбарын судалгааны ач холбогдол
