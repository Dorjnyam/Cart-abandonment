---
sidebar_position: 4
title: Integration заавар
---

# track.js — Сайтдаа оруулах заавар

Энэ хуудас Observer-ийн клиент snippet (`track.js`)-ийг e-commerce сайтад хэрхэн суурилуулах, тохируулах, шалгах талаар тайлбарлана.

---

## Хурдан эхлэх (1 минут)

HTML файлын `</body>` таг-ын өмнө нэг мөр код нэмэхэд л болно:

```html
<script
  src="http://localhost:8001/static/snippet/track.js?key=tk_basic_ТАНЫ_ТҮЛХҮҮР"
  defer
></script>
```

Ингэснээр:
- Хуудас бүр нээгдэхэд `page_view` event автоматаар илгээгдэнэ
- Scroll, click, idle зэрэг үйл явдлууд бүртгэгдэнэ
- Visitor болон session ID автоматаар үүсэж localStorage-д хадгалагдана

---

## API түлхүүр авах

```bash
# Tier сонгоод генерат хийх
curl -X POST http://localhost:8001/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"tier": "T3"}'

# Хариу:
# { "key": "tk_basic_xxxxxxxxxxxxxxxx", "tier": "T3" }
```

| Tier | Угтас | Хэзээ ашиглах |
|------|-------|--------------|
| T3 | `tk_basic_` | Энгийн хуудасны аналитик |
| T2 | `tk_smart_` | Бараа, хайлт, rage click бүртгэх |
| T1 | `tk_full_` | Checkout, сагс, төлбөр хянах |

---

## Next.js / React

`_app.tsx` эсвэл `layout.tsx`-д Script компонент ашиглана:

```tsx
// app/layout.tsx (Next.js 13+ App Router)
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="http://localhost:8001/static/snippet/track.js?key=tk_basic_ТАНЫ_ТҮЛХҮҮР"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
```

:::tip
`strategy="afterInteractive"` нь хуудас интерактив болсны дараа script ачаалах тул гүйцэтгэлд нөлөөлөхгүй.
:::

---

## Хэрэглэгчийн мэдээлэл дамжуулах (T1)

Нэвтэрсэн хэрэглэгчийн мэдээллийг `window._ca_user` объектоор дамжуулна:

```html
<script>
  window._ca_user = {
    is_logged_in: true,
    customer_type: "returning",   // "new" | "returning" | "vip"
  };
</script>
<!-- track.js дараа нь ачаалагдах ёстой -->
<script src="...track.js?key=tk_full_xxx" defer></script>
```

---

## Худалдааны товч тэмдэглэх (T1)

T1 түлхүүрт `data-ca` attribute нэмж тусгай event-ийг идэвхжүүлнэ:

```html
<!-- Сагсанд нэмэх товч -->
<button
  data-ca="cart_add"
  data-ca-id="prod_123"
  data-ca-price="89000"
  data-ca-name="Nike Air Force 1"
  data-ca-variant="44 / White"
>
  Сагсанд нэмэх
</button>

<!-- Checkout эхлүүлэх товч -->
<button data-ca="checkout_start">
  Захиалах
</button>

<!-- Хэмжээ сонгох -->
<button data-ca="select_size" data-ca-size="42">
  42
</button>
```

| `data-ca` утга | event_type | Тайлбар |
|----------------|------------|---------|
| `cart_add` | `cart_add` | Сагсанд нэмэх |
| `cart_remove` | `cart_remove` | Сагснаас хасах |
| `checkout_start` | `checkout_start` | Checkout эхлэх |
| `select_size` | `select_size` | Хэмжээ сонгох |
| *(аливаа нэр)* | тухайн нэр | Custom event |

---

## Захиалга амжилттай болсон мэдэгдэх (T1)

`window._ca.sendPurchase()` функцийг order success хуудаст дуудна:

```javascript
// Order success хуудаст
if (typeof window._ca !== 'undefined') {
  window._ca.sendPurchase({
    order_total: 178000,
    payment_method: "QPay",
    cart_item_count: 2,
    discount_code: "SALE10"
  });
}
```

---

## Custom event илгээх

```javascript
if (typeof window._ca !== 'undefined') {
  window._ca.sendEvent("wishlist_add", {
    product_id: "prod_456",
    product_name: "Adidas Ultraboost"
  });
}
```

---

## Snippet ажиллаж байна уу шалгах

1. Хөтөчийн **DevTools → Network** таб нээнэ
2. `/track` гэж шүүнэ
3. Хуудас дахин ачаална
4. `200 OK` хариутай `POST /track` харагдах ёстой

```
POST http://localhost:8001/track
Status: 200 OK
Response: {"status":"ok","id":1342,"tier":"T3",...}
```

---

## Snippet тест хуудас

Observer сервер дотор тест хуудас байгаа:

```
http://localhost:8001/snippet-test
```

Энэ хуудсыг нээж, DevTools-д `/track` → 200 харагдаж байна уу шалгана. Дараа нь `/viewer` хуудсыг нээж шинэ `page_view` event-ийг харна.

---

## Нийтлэг асуудлууд

### 401 Unauthorized

```json
{"detail": "Missing or invalid API key"}
```

**Шийдэл:** `?key=tk_basic_...` параметрийг шалгана. Угтас `tk_basic_`, `tk_smart_`, `tk_full_` байх ёстой.

### CORS алдаа

Observer нь wildcard CORS (`*`) тохируулсан байдаг. Харин хөгжүүлэлтийн сервер өөр port ашиглаж байвал хөтөч CORS-г хааж болно — Observer-ийн `main.py`-д `allow_origins`-д тухайн origin нэмэх шаардлагатай.

### T2/T1 талбарууд ирэхгүй байвал

Tier шалгана:

```bash
curl "http://localhost:8001/api/keys/validate?key=tk_basic_test"
# {"valid":true,"tier":"T3",...}
```

`T3` гарч байвал `tk_smart_` эсвэл `tk_full_` угтасаар шинэ түлхүүр үүсгэнэ.

---

## Дараагийн алхам

- [API лавлах](/docs/reference/api) — серверийн бүх endpoint
- [Tier 2 талбарууд](/docs/reference/fields/tier2) — T2-д юу нэмэгддэг
- [Tier 1 талбарууд](/docs/reference/fields/tier1) — T1 `data-ca-*` бүрэн жагсаалт
