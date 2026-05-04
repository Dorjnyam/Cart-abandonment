# E-commerce integration: Tier 2 vs Tier 1

This document lists **every Tier 2 (T2) payload field** the snippet can emit and what your store must know or align, and **every Tier 1 (T1) HTML `data-ca-*` attribute** you can put on buttons or other elements.

**API keys:** `tk_basic_*` → T3 only, `tk_smart_*` → T3+T2, `tk_full_*` → T3+T2+T1.

**Important:** In this project, **`data-ca` click tracking runs only for T1 (`tk_full_`)**. T2 does **not** receive cart/checkout events from `data-ca`; it still gets URL heuristics, behavioral counters, and automated listeners.

Authoritative allowlists: `observer/models/event.py` (`T2_EXTRA`, `T1_EXTRA`). Client behavior: `observer/snippet/track.js`.

---

## 1. Quick comparison

| Tier | E-commerce code changes |
|------|-------------------------|
| **T3** | Usually **none**: drop in `track.js` with `tk_basic_*`. |
| **T2** | Usually **none** for markup: snippet infers page type, filters, search from **URL** and listens for **clicks, errors, outbound links**, etc. You may want to **document your URL patterns** so analysts know how `detected_page_type` and `product_slug` map to your routes. |
| **T1** | **Yes** for rich commerce fields: add **`data-ca-*`** on key buttons (and/or set **`window._ca_user`** / **`window._ca.sendPurchase()`**). Requires **`tk_full_*`**. |

---

## 2. Tier 2 — full field list (23 extra fields on top of T3)

T2 storage = **29 T3 fields + these 23** = **52** distinct JSON keys allowed in `payload` (plus CORE columns).  
Below: each **T2-only** field, what fills it, and whether the **store** must provide anything.

| # | Field name | Type (typical) | Filled by snippet? | What the e-commerce team should know |
|---|------------|----------------|--------------------|--------------------------------------|
| 1 | `action_detected` | string | Yes (on some events) | Internal label for the action (e.g. `search`, `rage_click`). No markup required. |
| 2 | `button_text` | string | Yes (when applicable) | First ~80 chars of clicked element text. No markup required. |
| 3 | `rage_click` | number | Yes | Session counter of rage-click bursts. Automatic. |
| 4 | `outbound_click` | number | Yes | Session counter of external link clicks. Automatic. |
| 5 | `detected_page_type` | string | Yes (heuristic) | One of: `home`, `cart`, `checkout`, `account`, `order_success`, `search`, `product`, `category`, `other`. **Derived from path + query**, not from your CMS names. If your URLs differ (e.g. `/shop` only), values may show as `other` unless you rely on T1/`_ca_user` for context. |
| 6 | `product_slug` | string \| null | Yes (heuristic) | Last path segment when type is `product` (patterns like `/product/`, `/products/`, `/p/`). **Document your product URL shape** so analysts interpret slugs correctly. |
| 7 | `checkout_step_detected` | string \| null | Yes (heuristic) | Guessed from path when on `/checkout` (`step_1`, `shipping`, `payment`, etc.). **Document real checkout steps** if paths differ. |
| 8 | `search_query_from_url` | string \| null | Yes (heuristic) | From query params: `q`, `query`, `search`, `keyword`. **Ensure search uses one of these param names** or this stays empty (form search still sets `search_query` on submit — see row 15). |
| 9 | `is_order_success` | boolean | Yes | `true` when `detected_page_type === 'order_success'` (URL substring match). **Align thank-you URLs** with snippet heuristics or accept `false` on custom paths. |
| 10 | `product_id` | string \| null | Sometimes | From **product impression** hints (`data-product-id`, etc.) or **T1 `data-ca-id`** on cart events — **not** filled for T2-only keys on generic clicks. For T2 without T1, product id mainly appears when impression selector matches your DOM. |
| 11 | `product_price` | number \| null | Sometimes | Same as above: impressions / T1 `data-ca-price`. |
| 12 | `product_category` | string \| null | Sometimes | Impressions / T1 `data-ca-cat`. |
| 13 | `product_availability` | string \| null | Sometimes | T1 `data-ca-availability` or `_ca_user.product_availability`. |
| 14 | `selected_size` | string \| null | T1 `data-ca-size` | **T2-only key**: usually empty unless you use T1 attributes or `_ca_user`. |
| 15 | `selected_quantity` | number \| null | T1 `data-ca-qty` | Same. |
| 16 | `search_query` | string \| null | Yes | Set on **`search` event** when user submits a form with a search input (`input[type=search]`, `name=q|search|keyword`). **Match or extend selectors** in `track.js` if your markup differs. |
| 17 | `filter_name` | string \| null | Yes (URL) | From `?filter=` or `?filters=`. **Name your filter query params** accordingly or field stays null. |
| 18 | `filter_value` | string \| null | Yes (URL) | From `?filter_value=` or `?f=`. |
| 19 | `sort_value` | string \| null | Yes (URL) | From `?sort=`, `?orderby=`, or `?order=`. |
| 20 | `coupon_entered` | string \| null | Yes (URL) | From `?coupon=`, `?promo=`, or `?discount_code=`. |
| 21 | `js_error` | number | Yes | Session JS error count. Automatic. |
| 22 | `page_view_count` | number | Yes | Per-tab counter in `sessionStorage`. Automatic. |
| 23 | `back_navigation` | boolean | Yes | `true` when user uses browser back/forward (`popstate`). Automatic. |

### T2 “checklist” for the e-commerce team (no code, or light code)

1. **Routes:** Write down real paths for home, category, product, cart, checkout, search, order success. Compare to heuristic patterns in `inferPageContext()` in `track.js` (see §2.1).
2. **Search:** Confirm query parameter names for site search (`q`, `query`, `search`, `keyword`).
3. **Filters / sort / promo:** If you care about `filter_*`, `sort_value`, `coupon_entered` in analytics, align URL param names with those the snippet reads (or accept gaps).
4. **Product cards:** Optional — if you want better `product_impression` hints, use `data-product-id` (or customize `window.__CA_PRODUCT_SELECTOR`) so T2 events carry stable ids.

### 2.1 URL patterns used for `detected_page_type` (reference)

Paths are lowercased before matching. Your store might not match every pattern; unmatched pages become `other`.

| Detected value | Rough conditions (simplified) |
|----------------|------------------------------|
| `home` | `/`, `/index.html`, path ends with `/home` |
| `cart` | path contains `/cart`, `/basket`, `/bag` |
| `checkout` | path contains `/checkout` |
| `account` | `/account`, `/profile`, `/my-account`, `/login`, `/signin` |
| `order_success` | path contains `success`, `thank`, `confirmation`, `order-complete`, `order_success`, `order-received` |
| `search` | path contains `/search`, **or** URL has `q` / `query` / `search` / `keyword` |
| `product` | `/products/`, `/product/`, `/p/` |
| `category` | `/collection`, `/category`, `/categories/`, `/c/` |
| `other` | everything else |

---

## 3. Tier 1 — HTML `data-*` attributes (full list)

**Requires `tk_full_*`.** Only elements with these attributes are handled when the user **clicks** them (delegated click handler).

### 3.1 Primary attribute: event name

| HTML attribute | Required? | Purpose |
|----------------|------------|---------|
| `data-ca` | **Yes** | Becomes `event_type` in the event (e.g. `cart_add`, `cart_remove`, `checkout_start`, or any custom string you choose). |

Examples: `data-ca="cart_add"`, `data-ca="checkout_start"`.

### 3.2 Commerce / product attributes (map into payload)

All are **optional** on a given element; omit what you do not need.

| # | HTML attribute | Maps to payload field | Type / notes |
|---|----------------|-------------------------|----------------|
| 1 | `data-ca-id` | `product_id` | string |
| 2 | `data-ca-price` | `product_price` | number (parsed) |
| 3 | `data-ca-cat` | `product_category` | string |
| 4 | `data-ca-value` | `cart_value` | number (parsed); also used internally for cart state when present |
| 5 | `data-ca-size` | `selected_size` | string |
| 6 | `data-ca-qty` | `selected_quantity` | number (parsed) |
| 7 | `data-ca-availability` | `product_availability` | string |
| 8 | `data-ca-step` | `checkout_step` | string (e.g. `shipping`, `payment`) |
| 9 | `data-ca-payment` | `payment_method` | string |
| 10 | `data-ca-shipping` | `shipping_method` | string |
| 11 | `data-ca-order-total` | `order_total` | number (parsed) |
| 12 | `data-ca-discount` | `discount_code` | string |
| 13 | `data-ca-sale` | `is_sale` | boolean: `true` if value is `true` or `1` |
| 14 | `data-ca-variant` | `product_variant` | string (SKU / variant label) |
| 15 | `data-ca-stock` | `product_stock` | string |
| 16 | `data-ca-cart-count` | `cart_item_count` | number (parsed) |

**Also sent on these clicks (T1):**

- `action_detected` — same as `data-ca` value  
- `button_text` — trimmed inner text of the element (~80 chars)

### 3.3 Example: add to cart

```html
<button
  type="button"
  data-ca="cart_add"
  data-ca-id="SKU-12345"
  data-ca-price="89900"
  data-ca-cat="shoes"
  data-ca-value="89900"
  data-ca-size="42"
  data-ca-qty="1"
  data-ca-availability="in_stock"
  data-ca-variant="black-leather"
>
  Add to cart
</button>
```

### 3.4 Example: checkout step

```html
<button
  type="submit"
  data-ca="checkout_start"
  data-ca-step="payment"
  data-ca-payment="card"
  data-ca-order-total="179800"
  data-ca-discount="SUMMER10"
  data-ca-sale="1"
>
  Pay now
</button>
```

### 3.5 Count summary (T1 markup)

| Category | Count |
|----------|------:|
| `data-ca` (event name) | 1 required for tracking |
| `data-ca-*` commerce attributes | **16** optional attributes listed in §3.2 |

---

## 4. Tier 1 — JavaScript alternatives (no `data-ca` on that node)

### 4.1 `window._ca_user` (primitives only)

For **`tk_full_*`**, the snippet merges allowed keys from `window._ca_user` into the payload (strings truncated to 300 chars):

`customer_type`, `cart_value`, `cart_item_count`, `checkout_step`, `payment_method`, `shipping_method`, `order_total`, `discount_code`, `is_sale`, `product_variant`, `product_stock`, `product_id`, `product_price`, `product_category`, `product_availability`, plus `is_logged_in` if set.

Use this when data lives in your SPA state rather than on a single button.

### 4.2 `window._ca.sendPurchase(extra)`

Programmatic conversion: pass an object whose keys are **allowed T1/T2 field names** (e.g. `order_total`, `payment_method`). Fires a `purchase` event. See README and `track.js` for details.

---

## 5. What T3 “free” means vs T2 vs T1

- **T3:** Behavioral and environmental fields only (scroll, clicks, device, tab visibility, etc.). No `data-ca`, no T2 URL extras in payload.
- **T2:** Adds automated **e-commerce-shaped** signals from **URLs**, **forms**, **errors**, **outbound links**, **impressions**, **popups**, etc. You do **not** need a fixed list of “names from the CMS” unless you want analysts to map `detected_page_type` / slugs to your catalog.
- **T1:** Adds **exact** product/checkout values via **`data-ca-*`**, **`_ca_user`**, or **`sendPurchase`**.

---

## 6. Related files

| File | Role |
|------|------|
| `observer/models/event.py` | `ALLOWED_T3`, `T2_EXTRA`, `T1_EXTRA`, aliases |
| `observer/snippet/track.js` | Heuristics, listeners, `data-ca` parsing |
| [Observer README](/docs/) | Tiers, `data-ca`, migration notes |

---

*Generated to match the current codebase. If you change allowlists in `event.py`, update this document to stay in sync.*
