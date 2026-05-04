# Observer snippet in this Next.js app

How the storefront loads **Observer** `track.js`, which env vars matter, and how to verify it in the browser.

## What we load

- **No** legacy `<script src="/tracker.js?...">` in `<head>`. The demo `public/tracker.js` (and `window.CartTracker`) is optional; cart/checkout code still calls `CartTracker` when present, but the app no longer injects that script by default.
- **`beforeInteractive`** inline config sets globals **before** `track.js` runs (reliable if the snippet reads them on init):
  - `window.__OBSERVER_BASE__` — Observer origin (no trailing slash required; match your server).
  - `window.__OBSERVER_API_KEY__` — same value as the `key=` query param (e.g. `tk_full_…`, `tk_smart_…`).
- **`afterInteractive`** loads:
  - `{OBSERVER_URL}/static/snippet/track.js?key={encodeURIComponent(OBSERVER_SNIPPET_KEY)}`

Source: [`src/app/layout.tsx`](../src/app/layout.tsx).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_OBSERVER_URL` | Observer base URL (e.g. `http://localhost:8001`). |
| `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY` | Snippet key (`tk_basic_*` / `tk_smart_*` / `tk_full_*`). |

**Fallback behavior:** In [`layout.tsx`](../src/app/layout.tsx), `NEXT_PUBLIC_OBSERVER_URL?.trim() || "http://localhost:8001"` (and the same pattern for the snippet key) so empty strings from `.env` do not win over the default. Add **`.env.local`** next to `package.json` (see repo template values), set your real snippet key, then restart `next dev`.

After editing **`.env.local`**, restart `next dev` so Next.js picks up changes to `NEXT_PUBLIC_*` vars.

## Tier keys (reminder)

- `tk_basic_*` → T3 only  
- `tk_smart_*` → T3 + T2  
- `tk_full_*` → T3 + T2 + T1 (`data-ca`, `_ca_user`, `sendPurchase`)

Commerce attributes in the app require a **`tk_full_*`** key for delegated click tracking.

## Verify in the browser

1. Open DevTools → **Network**.
2. Reload the page.
3. Confirm **`track.js`** returns **200** from your Observer host (e.g. `:8001`).
4. Interact with the site and confirm **track** / beacon **POST** requests return **200** (exact path depends on your Observer version).

## Debug mode

In the console:

```js
window.__OBSERVER_DEBUG__ = true;
```

Reload and watch the console for Observer warnings or diagnostic output (behavior depends on your `track.js` build).

## `track.js` is 200 but ingest POST is not

On `http://localhost:3000`, open **Network**, filter by **Fetch/XHR** or the ingest path your snippet uses. If the track **POST** is not **200**, note the **status** (e.g. **401** invalid key, **403** blocked, **404** wrong path, **CORS** error in console with no status) and fix Observer config / CORS / key on the Observer server accordingly.

## Related

- Root layout scripts: [`src/app/layout.tsx`](../src/app/layout.tsx)  
- T1 helpers: [`src/lib/commerce-attrs.ts`](../src/lib/commerce-attrs.ts), [`src/components/CaCommerceSync.tsx`](../src/components/CaCommerceSync.tsx)  
- Main README environment table: [`README.md`](../README.md)
