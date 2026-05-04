# Observer Experiment — Complete System Workflow

Everything about how the system works, from a single page load to the data landing in PostgreSQL and being viewed in the dashboard.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  E-commerce site (shoe shop, etc.)                  │    │
│  │                                                     │    │
│  │  <script src="http://SERVER/static/snippet/         │    │
│  │    track.js?key=tk_basic_abc123"></script>           │    │
│  │                                                     │    │
│  │  track.js runs inside the page:                     │    │
│  │   • Reads API key from its own script URL           │    │
│  │   • Determines tier (T3/T2/T1) from key prefix     │    │
│  │   • Enables/disables listeners based on tier        │    │
│  │   • Collects scroll, clicks, device, visitor data   │    │
│  │   • Sends POST /track with X-API-Key header         │    │
│  └──────────────────┬──────────────────────────────────┘    │
│                     │ POST /track (JSON)                    │
│                     │ Header: X-API-Key: tk_basic_abc123    │
└─────────────────────┼───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               OBSERVER SERVER (FastAPI + Uvicorn)           │
│               http://0.0.0.0:8001                           │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  Middleware: APIKeyAuthMiddleware │                       │
│  │  Extracts key from headers       │                       │
│  │  Resolves tier (T3/T2/T1)        │                       │
│  └──────────┬───────────────────────┘                       │
│             ▼                                               │
│  ┌──────────────────────────────────┐                       │
│  │  POST /track handler (_ingest)   │                       │
│  │  1. Parse JSON body              │                       │
│  │  2. Extract API key              │                       │
│  │  3. Resolve tier → 401 if bad    │                       │
│  │  4. Add ip + user_agent          │                       │
│  │  5. filter_payload_for_tier()    │                       │
│  │  6. save_event() → PostgreSQL    │                       │
│  └──────────┬───────────────────────┘                       │
│             ▼                                               │
│  ┌──────────────────────────────────┐                       │
│  │  PostgreSQL: raw_events table    │                       │
│  │  CORE columns + JSONB payload    │                       │
│  │  + tier column                   │                       │
│  └──────────────────────────────────┘                       │
│                                                             │
│  ┌──────────────────────────────────┐                       │
│  │  Viewer: GET /viewer             │                       │
│  │  viewer.html — dashboard UI      │                       │
│  │  8 tabs for analyzing events     │                       │
│  └──────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Project File Structure

```
observer_experiment/
├── .env                          # DATABASE_URL + optional OBSERVER_API_KEYS
├── main.py                       # Thin shim → runs observer.main:app
├── database.py                   # Legacy shim → re-exports from observer.database
├── snippet.js                    # Legacy client (no API key, pre-tier era)
├── viewer.html                   # Dashboard UI (served at /viewer)
├── requirements.txt              # Python dependencies
├── README.md                     # Project documentation
├── WORKFLOW.md                   # This file
│
└── observer/                     # Main Python package
    ├── __init__.py               # Package init (version)
    ├── __main__.py               # python -m observer entry point
    ├── main.py                   # FastAPI app: routes, middleware, lifespan
    ├── database.py               # asyncpg pool, init_db, CRUD operations
    ├── api_keys.py               # Key generation + validation helpers
    ├── api_key_allowlist.py      # Optional full-key allowlist from env
    │
    ├── middleware/
    │   ├── __init__.py
    │   └── auth.py               # API key extraction, tier resolution, middleware
    │
    ├── models/
    │   ├── __init__.py
    │   └── event.py              # Tier field allowlists, normalization, filtering
    │
    └── snippet/
        └── track.js              # Client-side tracking script (tiered)
```

---

## 3. The Complete Request Lifecycle

Here is exactly what happens from the moment a user loads a page to the data being stored.

### Step 1: Page Load — `track.js` Initializes

When a page includes `<script src="http://SERVER/static/snippet/track.js?key=tk_basic_xxx">`, the browser downloads and executes `track.js`. On startup, the script:

1. **Extracts the API key** from its own `<script>` tag's URL query parameter (`?key=...`).
2. **Determines the tier** from the key prefix:
   - `tk_basic_` → T3 (rank 1)
   - `tk_smart_` → T2 (rank 2)
   - `tk_full_` → T1 (rank 3)
3. **Aborts if no valid key** — logs an error to console and does nothing.
4. **Builds field allowlists** matching the server-side schema (three arrays: `KEYS_T3`, `KEYS_T2_EXTRA`, `KEYS_T1_EXTRA`), and a `pickKeys()` function that strips any fields not in the current tier's union.
5. **Reads or creates visitor identity**:
   - `_ca_visitor` cookie (365 days): stores `visitor_id`, `visit_count`, `first_visit`, `days_since_first`, `cart_abandoned_count`, `order_count`, `purchased_before`.
   - `_ca_session` in `sessionStorage`: a random session ID that persists until the tab closes.
6. **Collects device info** once: `device_type`, screen/viewport dimensions, `language`, `timezone`, `connection_type`, browser flags, etc.
7. **Registers event listeners** based on the tier:

| Listener | T3 | T2 | T1 |
|----------|:--:|:--:|:--:|
| Scroll tracking | yes | yes | yes |
| Click counting | yes | yes | yes |
| Mouse position | yes | yes | yes |
| Keyboard counting | yes | yes | yes |
| Copy/paste detection | yes | yes | yes |
| Form field tracking | yes | yes | yes |
| Tab visibility | yes | yes | yes |
| Idle detection | yes | yes | yes |
| Heartbeat (30s) | yes | yes | yes |
| Session end (beforeunload) | yes | yes | yes |
| `data-ca` button clicks | — | — | yes |
| Search form submit | yes | yes | yes |
| Outbound link clicks | — | yes | yes |
| Rage click detection | — | yes | yes |
| JS error capture | — | yes | yes |
| Product impression (IntersectionObserver) | — | yes | yes |
| Popup/modal detection (MutationObserver) | — | yes | yes |
| Purchase heuristic (URL-based) | — | yes | yes |
| Back navigation (popstate) | — | yes | yes |
| `window._ca_user` full merge | — | — | yes |
| `_ca.sendPurchase()` API | — | — | yes |

### Step 2: Events Are Generated

As the user interacts with the page, `track.js` generates events. Every event passes through `buildBasePayload()`, which constructs a raw object containing all possible fields, then `pickKeys()` strips it down to only the fields allowed for the current tier.

The event types and when they fire:

| Event | Trigger |
|-------|---------|
| `page_view` | Immediately when `track.js` initializes |
| `heartbeat` | Every 30 seconds while page is open |
| `session_end` | `beforeunload` — user leaves/closes page |
| `cart_add` | Click on `[data-ca="cart_add"]` (T1 only) |
| `cart_remove` | Click on `[data-ca="cart_remove"]` (T1 only) |
| `checkout_start` | Click on `[data-ca="checkout_start"]` (T1 only) |
| `copy` | User copies text |
| `tab_hidden` | Tab loses focus (`visibilitychange`) |
| `tab_visible` | Tab regains focus |
| `idle_start` | No interaction for 5+ seconds |
| `idle_end` | Interaction resumes after idle |
| `search` | Form with search input is submitted |
| `rage_click` | 3+ rapid clicks in same area (T2+) |
| `js_error` | `window.onerror` or `unhandledrejection` (T2+, max 5/min) |
| `outbound_click` | Click on external `<a>` link (T2+) |
| `product_impression` | Product card enters viewport (T2+, max 30/page) |
| `popup_open` | Modal/dialog appears in DOM (T2+) |
| `purchase` | URL matches order success pattern (T2+) or `_ca.sendPurchase()` (T1) |

### Step 3: `sendEvent()` — POST to Server

Every event is sent via `fetch()`:

```
POST http://SERVER/track
Content-Type: application/json
X-API-Key: tk_basic_abc123

{
  "visitor_id": "v_abc123_1a2b3c",
  "session_id": "s_def456_4d5e6f",
  "event_type": "page_view",
  "url": "https://shop.example.com/products/shoes",
  "referrer": "https://google.com",
  "timestamp": "2026-03-21T14:30:00.000Z",
  "path": "/products/shoes",
  "device_type": "desktop",
  "viewport_width": 1920,
  "language": "en-US",
  "timezone": "Asia/Ulaanbaatar",
  "connection_type": "4g",
  "visit_count": 3,
  "days_since_first": 12,
  ...
}
```

The payload only contains fields that `pickKeys()` kept for the current tier. The key is in the `X-API-Key` header, not in the body.

### Step 4: Server Middleware — `APIKeyAuthMiddleware`

Before the request reaches the route handler, the Starlette middleware (`observer/middleware/auth.py`) runs:

1. Reads the key from `X-API-Key` header (or `Authorization: Bearer` as fallback).
2. Calls `resolve_tier_for_key(key)`:
   - `tier_from_key_prefix(key)` — checks `startswith("tk_basic_")` etc. → returns `"T3"`, `"T2"`, or `"T1"`.
   - `is_key_in_allowlist(key)` — if `OBSERVER_API_KEYS` env var is set, the full key must exactly match one of the comma-separated entries. If unset, any suffix is accepted.
3. Stores `request.state.observer_header_key` and `request.state.observer_header_tier` on the request for the route to use.

### Step 5: Route Handler — `_ingest()`

The `POST /track` handler in `observer/main.py`:

1. **Parses body** as JSON (falls back to form data).
2. **Extracts the API key** from headers first, then body `api_key` field as fallback.
3. **Resolves tier** via `resolve_tier_for_key()` — returns 401 if invalid.
4. **Strips `api_key`** from the data (never stored).
5. **Adds server-side fields**: `ip` (from `request.client.host`) and `user_agent` (from header).
6. **Filters payload** via `filter_payload_for_tier(data, tier)` — this is the critical step.

### Step 6: Payload Filtering — `filter_payload_for_tier()`

In `observer/models/event.py`, this function applies three transforms:

**a) Normalize keys** (`normalize_incoming_keys`):
- Aliases are renamed: `likely_logged_in` → `is_logged_in`, `js_error_count` → `js_error`, `rage_click_bursts` → `rage_click`, `query` → `search_query`, etc.
- Known `ca_user_*` fields are mapped: `ca_user_customer_type` → `customer_type`, `ca_user_is_logged_in` → `is_logged_in`.
- Unknown `ca_user_*` fields are **dropped**.
- Forbidden keys (`api_key`, `authorization`, `password`, `token`, `secret`) are **dropped**.

**b) Build tier allowlist**:
- T3: `ALLOWED_T3` (29 fields)
- T2: `ALLOWED_T3 ∪ T2_EXTRA` (29 + 23 = 52 fields)
- T1: `ALLOWED_T2 ∪ T1_EXTRA` (52 + 10 = 62 fields)

**c) Filter**:
- `CORE_DB_KEYS` (`visitor_id`, `session_id`, `event_type`, `url`, `referrer`, `timestamp`, `ip`, `user_agent`) always pass through — they become their own database columns.
- All other keys must appear in the tier's allowlist to survive.
- Any key not in the allowlist is silently dropped.

### Step 7: Database Storage — `save_event()`

In `observer/database.py`, the filtered data is split and stored:

```
raw_events table
┌──────────┬────────────┬────────────┬────────────┬───────────┐
│ id (PK)  │ visitor_id │ session_id │ event_type │ url       │
├──────────┼────────────┼────────────┼────────────┼───────────┤
│ referrer │ timestamp  │ ip         │ user_agent │ tier      │
├──────────┼────────────────────────────────────────┼──────────┤
│ payload (JSONB) ─ everything else │ created_at │
└─────────────────────────────────────────────────────────────┘
```

- 8 CORE columns are stored as dedicated TEXT columns.
- Everything else goes into the `payload` JSONB column.
- `tier` column stores the resolved tier string (`"T1"`, `"T2"`, `"T3"`).
- `created_at` is auto-set by PostgreSQL (`NOW()`).

**Indexes**: `session_id`, `visitor_id`, `event_type`, `created_at DESC`, `payload` (GIN for JSONB queries), `tier`.

### Step 8: Response to Client

The server responds with:

```json
{
  "status": "ok",
  "id": 42,
  "tier": "T3",
  "received_fields": ["visitor_id", "session_id", "event_type", "url", ...],
  "payload_field_count": 15
}
```

---

## 4. Tier System — What Each Tier Gets

### Tier 3 — Basic (`tk_basic_*`)

The cheapest tier. Captures behavioral signals without e-commerce specifics.

**29 payload fields:**
`visitor_id`, `session_id`, `visit_count`, `days_since_first`, `cart_abandoned_count`, `url`, `path`, `referrer`, `page_load_ms`, `device_type`, `viewport_width`, `language`, `timezone`, `connection_type`, `time_on_page_sec`, `max_scroll_pct`, `scroll_up_count`, `click_count`, `active_time_ms`, `tab_hidden_count`, `tab_hidden_ms`, `copy_count`, `form_fields_count`, `form_fields_touched`, `bounce`, `session_duration_sec`, `is_logged_in`, `customer_type`, `order_count`

**Active client listeners:** Scroll, clicks, keyboard, copy/paste, form focus, tab visibility, idle detection, heartbeat, session end, `data-ca` buttons, search forms.

**Disabled:** Outbound clicks, rage clicks, JS errors, product impressions, popups, purchase heuristic, back navigation.

### Tier 2 — Smart (`tk_smart_*`)

Everything in T3, plus e-commerce intelligence and error tracking.

**23 additional fields:**
`action_detected`, `button_text`, `rage_click`, `outbound_click`, `detected_page_type`, `product_slug`, `checkout_step_detected`, `search_query_from_url`, `is_order_success`, `product_id`, `product_price`, `product_category`, `product_availability`, `selected_size`, `selected_quantity`, `search_query`, `filter_name`, `filter_value`, `sort_value`, `coupon_entered`, `js_error`, `page_view_count`, `back_navigation`

**Additional client listeners:** Outbound link clicks, rage click detection, JS error capture, IntersectionObserver for product cards, MutationObserver for popups, purchase URL heuristic, popstate (back navigation), checkout step inference, filter/sort/coupon URL detection.

### Tier 1 — Full (`tk_full_*`)

Everything in T2, plus checkout and commerce transaction details.

**10 additional fields:**
`cart_value`, `cart_item_count`, `checkout_step`, `payment_method`, `shipping_method`, `order_total`, `discount_code`, `is_sale`, `product_variant`, `product_stock`

**Additional client capabilities:**
- `window._ca_user` full merge — reads primitive values from a JavaScript object the e-commerce app sets.
- `window._ca.sendPurchase({ order_total, payment_method, ... })` — manual conversion API.
- Extended `data-ca-*` attributes: `data-ca-step`, `data-ca-payment`, `data-ca-shipping`, `data-ca-order-total`, `data-ca-discount`, `data-ca-sale`, `data-ca-variant`, `data-ca-stock`, `data-ca-cart-count`, `data-ca-size`, `data-ca-qty`, `data-ca-availability`.

### Double filtering

The tier is enforced **twice**:
1. **Client-side** (`track.js`): `pickKeys()` only includes fields in the current tier's list, and certain listeners are never registered for lower tiers. This reduces network payload.
2. **Server-side** (`event.py`): `filter_payload_for_tier()` strips any field not in the tier's allowlist. This is the authoritative gate — even if someone manually sends extra fields, they are dropped.

---

## 5. API Key System

### Key Format

```
tk_basic_<random_suffix>   → Tier 3
tk_smart_<random_suffix>   → Tier 2
tk_full_<random_suffix>    → Tier 1
```

### Key Transport (priority order)

1. `X-API-Key` header (used by `track.js`)
2. `Authorization: Bearer <key>` header
3. JSON body field `api_key` (last resort; key is stripped before storage)

### Validation Modes

**Mode A — Prefix-only (default):** When `OBSERVER_API_KEYS` is not set in `.env`, only the prefix is checked. Any `tk_basic_anythingyouwant` works. Good for development.

**Mode B — Full allowlist:** When `OBSERVER_API_KEYS=tk_basic_abc,tk_smart_xyz` is set, the entire key string must exactly match one entry. Changing even one character fails. Good for production.

### Key Management Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/keys/generate` | POST | Generate a random key for a tier (`{"tier": "T3"}`) |
| `/api/keys/validate` | GET/POST | Check if a key is valid |
| `/api/keys/status` | GET | Whether allowlist is active + key count |

Keys are not stored by the server. The generate endpoint creates a random suffix — you must copy it and add to `OBSERVER_API_KEYS` if using allowlist mode.

---

## 6. Field Normalization — Aliases

Some fields have legacy or client-side names that differ from what's stored. The server normalizes them:

| Client sends | Stored as |
|-------------|-----------|
| `likely_logged_in` | `is_logged_in` |
| `js_error_count` | `js_error` |
| `outbound_click_count` | `outbound_click` |
| `rage_click_bursts` | `rage_click` |
| `query` | `search_query` |
| `ca_user_customer_type` | `customer_type` |
| `ca_user_is_logged_in` | `is_logged_in` |

Any `ca_user_*` key not in the explicit map above is dropped — the server does not accept arbitrary `ca_user_` fields.

---

## 7. Database Schema

### Table: `raw_events`

| Column | Type | Source |
|--------|------|--------|
| `id` | `BIGSERIAL` (PK) | Auto-increment |
| `visitor_id` | `TEXT` | Client cookie `_ca_visitor.id` |
| `session_id` | `TEXT` | Client `sessionStorage._ca_session` |
| `event_type` | `TEXT` | `"page_view"`, `"heartbeat"`, etc. |
| `url` | `TEXT` | `window.location.href` |
| `referrer` | `TEXT` | `document.referrer` |
| `timestamp` | `TEXT` | Client-side ISO-8601 |
| `ip` | `TEXT` | Server: `request.client.host` |
| `user_agent` | `TEXT` | Server: `User-Agent` header |
| `payload` | `JSONB` | All tier-filtered fields not in CORE |
| `tier` | `TEXT` | `"T1"`, `"T2"`, or `"T3"` |
| `created_at` | `TIMESTAMPTZ` | Server: `NOW()` |

### Indexes

```sql
idx_session       ON (session_id)
idx_visitor       ON (visitor_id)
idx_event_type    ON (event_type)
idx_created       ON (created_at DESC)
idx_payload_gin   USING GIN (payload)
idx_raw_events_tier ON (tier)
```

### Querying JSONB

```sql
-- Text field
SELECT payload->>'device_type' FROM raw_events;

-- Numeric field
SELECT (payload->>'max_scroll_pct')::numeric FROM raw_events;

-- Filter by JSONB value
SELECT * FROM raw_events WHERE payload->>'bounce' = 'true';
```

---

## 8. Viewer Dashboard — 8 Tabs

The viewer (`GET /viewer`) is a single-page HTML dashboard with JavaScript that polls the API.

### Tab 1: Events

Shows all events in reverse chronological order. Each row shows:
- Event ID (clickable → opens Tier Inspect)
- Timestamp, event type badge, visitor/session (clickable → opens those tabs)
- URL path, device type, visit count, scroll %, time on page, clicks, tab switches
- Payload toggle (click to expand full JSON)

Filters: event type dropdown, row limit. Auto-refreshes every 5 seconds.

### Tab 2: Fields

Bar chart showing which JSONB payload fields exist across all events, sorted by frequency. Powered by `jsonb_object_keys()` aggregation. Shows field name, fill percentage, and absolute count.

### Tab 3: Sessions

Look up a session by ID or load the latest. Shows a timeline of every event in that session with summary stats (duration, visit count, device, scroll, clicks, tab switches, cart adds).

### Tab 4: Visitor

Look up a visitor by ID or load the latest. Shows all sessions for that visitor — when they started, event count, device, visit number, scroll, clicks, and event types. Clicking a session navigates to the Sessions tab.

### Tab 5: Event Types

Grid of cards showing each event type with its count and percentage of total events, with a visual bar.

### Tab 6: SQL Query

Free-form SQL editor (SELECT only). Includes preset queries for visitor analysis, scroll depth buckets, cart events, and hourly distribution. Results display as formatted JSON.

### Tab 7: API Key

Generate new keys (pick tier → get random key + copy-able script tag). Validate existing keys. Shows whether the server's allowlist is active.

### Tab 8: Tier Inspect

Select any event from the Events tab (click its ID) to see a three-column breakdown:
- **Tier 3 column**: all 29 T3 fields, each with a green dot (present + value shown) or gray dot (missing)
- **Tier 2 column**: all 23 T2-extra fields, same treatment
- **Tier 1 column**: all 10 T1-extra fields, same treatment

Each column header shows present/total count and percentage. This lets you instantly see which tier fields an event captured.

---

## 9. Client-Side State Management

`track.js` maintains several pieces of state in the browser:

### Cookies (persist across sessions)

| Cookie | Duration | Contains |
|--------|----------|----------|
| `_ca_visitor` | 365 days | JSON: `id`, `visit_count`, `first_visit`, `last_visit`, `days_since_first`, `purchased_before`, `cart_abandoned_count`, `order_count` |

### sessionStorage (cleared when tab closes)

| Key | Contains |
|-----|----------|
| `_ca_session` | Random session ID |
| `_ca_pvc` | Page view count within session |

### In-memory state (per page)

```
Scroll:     max_scroll_pct, max_scroll_px, scroll_up_count, scroll_down_count, velocity
Clicks:     click_count, right_click_count, last_mouse_x/y
Keyboard:   key_press_count
Attention:  idle_time_ms, active_time_ms, tab_hidden_count, tab_hidden_ms
Copy:       copy_count, paste_count, copied_text_len
Forms:      form_fields_count, form_fields_touched (set of field names)
Cart:       cart_add_count, cart_remove_count, last_cart_value
Counters:   rage_click_bursts, js_error_count, outbound_click_count
            product_impressions_distinct, popup_open_count
Navigation: back_navigation (boolean, from popstate)
```

---

## 10. How `data-ca` Attributes Work (T1 Only)

The `data-ca` click listener is **T1 only** (`tk_full_`). On T3 and T2 keys, `[data-ca]` button clicks are ignored by `track.js`.

The e-commerce site adds HTML attributes to buttons:

```html
<button
  data-ca="cart_add"
  data-ca-id="shoe-123"
  data-ca-price="89000"
  data-ca-cat="shoes"
  data-ca-value="89000">
  Add to Cart
</button>
```

When clicked (T1 only), `track.js`:
1. Reads `data-ca` as the `event_type`.
2. Extracts all `data-ca-*` attributes into their canonical field names (`data-ca-id` → `product_id`, `data-ca-price` → `product_price`, `data-ca-cat` → `product_category`, `data-ca-value` → `cart_value`, etc.).
3. Captures `button_text` (first 80 chars of button text).
4. Merges with `buildBasePayload()`.
5. Sends via `sendEvent()`.

**All `data-ca-*` attributes:** `data-ca-id`, `data-ca-price`, `data-ca-cat`, `data-ca-value`, `data-ca-step`, `data-ca-payment`, `data-ca-shipping`, `data-ca-order-total`, `data-ca-discount`, `data-ca-sale`, `data-ca-variant`, `data-ca-stock`, `data-ca-cart-count`, `data-ca-size`, `data-ca-qty`, `data-ca-availability`.

---

## 11. Heuristic Detection (T2+)

`track.js` infers context from the URL and DOM without any configuration:

### Page Type Detection

| URL pattern | Detected type |
|-------------|--------------|
| `/`, `/home` | `home` |
| `/cart`, `/basket`, `/bag` | `cart` |
| `/checkout` | `checkout` |
| `/account`, `/profile`, `/login` | `account` |
| URL contains `success`, `thank`, `confirmation` | `order_success` |
| `/search` or has `?q=` parameter | `search` |
| `/product/`, `/products/`, `/p/` | `product` |
| `/collection/`, `/category/`, `/c/` | `category` |

### Checkout Step Detection

If on `/checkout`, looks for `step_N`, `shipping`, `payment`, or `review` in the path.

### Filter/Sort/Coupon Detection

Reads URL query parameters: `?filter=`, `?sort=`, `?coupon=`, etc.

### Logged-in Detection

Checks `document.body.className` for markers like `logged-in`, `customer-logged-in`, `user-logged-in`.

### JSON-LD Product Extraction

Parses `<script type="application/ld+json">` blocks for Product schema — extracts `name`, `sku`, `productID`, `price`, `brand`.

### Popup/Modal Detection (T2+, reviewed)

`MutationObserver` watches for new elements matching common modal selectors (`[role=dialog]`, `.modal`, etc.). Fires a `popup_open` event the first time each modal appears. This was reviewed and kept in T2 for experiment observation — score impact can be evaluated from collected data.

### Product Impression (T2+)

`IntersectionObserver` watches product cards (matched by `[data-product-id]`, `.product-card`, etc. or a custom `window.__CA_PRODUCT_SELECTOR`). Fires `product_impression` when a card first enters the viewport, capped at 30 events per page to avoid performance issues.

---

## 12. Server API Endpoints

| Endpoint | Method | Auth? | Description |
|----------|--------|-------|-------------|
| `/track` | POST | Yes (API key) | Ingest events |
| `/collect` | POST | Yes (API key) | Alias for `/track` |
| `/viewer` | GET | No | Dashboard HTML |
| `/events` | GET | No | List events (params: `limit`, `event_type`, `session_id`) |
| `/stats` | GET | No | Aggregate statistics |
| `/fields` | GET | No | JSONB field frequency analysis |
| `/session/{id}` | GET | No | All events for a session |
| `/visitor/{id}` | GET | No | All sessions for a visitor |
| `/query` | POST | No | Run arbitrary SELECT SQL |
| `/clear` | DELETE | No | Delete all events |
| `/api/keys/validate` | GET/POST | No | Check if a key is valid |
| `/api/keys/generate` | POST | No | Generate random key |
| `/api/keys/status` | GET | No | Allowlist status |
| `/static/snippet/track.js` | GET | No | Client tracking script |
| `/docs` | GET | No | FastAPI Swagger UI |

---

## 13. Data Flow Diagram — One Event's Journey

```
User scrolls page
       │
       ▼
track.js scroll listener updates state.max_scroll_pct
       │
       │ (30 seconds pass)
       ▼
heartbeat timer fires
       │
       ▼
buildBasePayload() creates object with ~60+ raw fields:
  { visitor_id, session_id, url, path, device_type,
    max_scroll_pct, click_count, time_on_page_sec, ... }
       │
       ▼
pickKeys(payload, keysForCurrentTier()) — e.g., for T3:
  Drops: detected_page_type, product_slug, js_error, ...
  Keeps: visitor_id, max_scroll_pct, click_count, ...
       │
       ▼
sendEvent("heartbeat", filteredPayload)
       │
       ▼
fetch("POST /track", {
  headers: { "X-API-Key": "tk_basic_abc123" },
  body: JSON.stringify(mergedPayload)
})
       │
       ▼
┌─ SERVER ────────────────────────────────┐
│                                         │
│  APIKeyAuthMiddleware                   │
│    → extracts key from X-API-Key header │
│    → resolve_tier_for_key("tk_basic_abc123") │
│    → tier = "T3"                        │
│                                         │
│  _ingest() handler                      │
│    → parse JSON body                    │
│    → extract key (already have it)      │
│    → add ip = "10.3.135.74"             │
│    → add user_agent = "Mozilla/..."     │
│                                         │
│  filter_payload_for_tier(data, "T3")    │
│    → normalize_incoming_keys():         │
│       likely_logged_in → is_logged_in   │
│       ca_user_foo → DROPPED             │
│    → keep CORE_DB_KEYS always           │
│    → keep only ALLOWED_T3 fields        │
│    → drop everything else               │
│                                         │
│  save_event(filtered, tier="T3")        │
│    → CORE → dedicated columns           │
│    → rest → JSONB payload               │
│    → tier → tier column                 │
│    → RETURNING id → 42                  │
│                                         │
│  Response: {"status":"ok","id":42,      │
│             "tier":"T3",...}             │
└─────────────────────────────────────────┘
```

---

## 14. Network & LAN Setup

The server binds to `0.0.0.0:8001`, meaning it listens on all network interfaces. To access from other devices on the LAN:

1. Find the server machine's IPv4 address (`ipconfig` on Windows).
2. Ensure Windows Firewall allows inbound TCP on port 8001.
3. Use `http://<LAN_IP>:8001/viewer` from other devices.
4. In the tracking script, use the LAN IP:
   ```html
   <script src="http://<LAN_IP>:8001/static/snippet/track.js?key=tk_basic_xxx"></script>
   ```

CORS is set to `allow_origins=["*"]` so any origin can send events.

### Optional Redis fan-out (dual-path architecture)

If `REDIS_URL` is set and Redis accepts connections, after each successful PostgreSQL insert `_ingest` calls `push_to_redis()` in `observer/redis_queue.py`:

- **`ca:events:{visitor_id}`** — `LPUSH` a small JSON envelope (`session_id`, `event_type`, `tier`, `visitor_id`); **`EXPIRE` 86400s**. Full payloads stay in PostgreSQL only.
- **`ca:diagnosis:queue`** — same `LPUSH` when `event_type === "session_end"` so a Main Service worker can `BRPOP` and run diagnosis without polling.

If `REDIS_URL` is empty or Redis is down, pushes are skipped and ingest still returns `200`. On push failure the client connection is closed so the next request can reconnect. App shutdown calls `close_redis()`.

Copy-paste templates for a **Main Service** consumer (Redis `BRPOP` + DB polling, `processed_sessions` DDL, Observer read-only queries): [Integration заавар](/project-docs/integration).

---

## 15. Auto-Refresh & Real-Time Feel

The viewer calls `refresh()` every 5 seconds. This fetches `/stats` and reloads the current tab's data. The "Live" indicator in the header turns green when the server is reachable, red when not.

Events from `track.js` arrive at different cadences:
- `page_view`: once per page load (immediate)
- `heartbeat`: every 30 seconds
- User-triggered: clicks, copy, search, etc. — as they happen
- `session_end`: when the user leaves (unreliable — `beforeunload` is best-effort)

---

## 16. Security Considerations

| Concern | How it's handled |
|---------|-----------------|
| PII in `_ca_user` | Keys containing `email`, `password`, `token`, `secret`, `ssn`, `credential`, `creditcard`, `authorization` are rejected client-side. Values are limited to 500 chars, max 24 keys. |
| API key in body | Stripped before storage (`data.pop("api_key", None)`). |
| Forbidden keys | `api_key`, `authorization`, `password`, `token`, `secret` are dropped server-side. |
| SQL injection | `/query` only allows `SELECT` statements. |
| API key exposure | The key is visible in the `<script>` URL (like a public client ID). Use `OBSERVER_API_KEYS` allowlist for production — changing a character breaks the key. |
| No authentication on viewer | The dashboard and all read endpoints are public. This is intentional for a local experiment — add auth middleware for production. |

---

## 17. Dependencies

```
fastapi==0.115.0          # Web framework
uvicorn[standard]==0.30.0 # ASGI server
asyncpg==0.29.0           # PostgreSQL async driver
python-multipart==0.0.9   # Form data parsing
python-dotenv==1.0.0      # .env file loading
redis>=5.0.0              # Optional async client for REDIS_URL fan-out
```

PostgreSQL must be running separately. Connection string is in `.env` as `DATABASE_URL`. Redis is optional (`REDIS_URL`).

---

## 18. How to Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Set up PostgreSQL and .env
#    DATABASE_URL=postgresql://user:pass@localhost:5432/observer_experiment

# 3. Start server
python main.py
# or
uvicorn observer.main:app --host 0.0.0.0 --port 8001 --reload

# 4. Open viewer
#    http://localhost:8001/viewer

# 5. Add to your site (before </body>)
#    <script src="http://localhost:8001/static/snippet/track.js?key=tk_basic_YOUR_KEY"></script>
```

The database table and indexes are created automatically on first startup (`init_db()`).
