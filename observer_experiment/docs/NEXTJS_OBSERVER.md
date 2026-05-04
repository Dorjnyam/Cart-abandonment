# Next.js + Observer `track.js`

## Start here (do these in order)

**Step 0 — Prove Observer works (no Next.js)**  
While Observer is running on port 8001, open in Chrome:

`http://localhost:8001/snippet-test`

- If **Network → `track`** is **200** and **`/viewer`** shows a new **`page_view`**: your API key + DB + Redis (optional) are fine. Continue with Step 1 — the bug is only in Next.js / env / CSP.
- If **401** on `track`: key wrong or **not** in `OBSERVER_API_KEYS` allowlist. Use  
  `http://localhost:8001/snippet-test?key=PASTE_EXACT_KEY`
- If **snippet-test** never loads: Observer is not running or wrong port.

**Step 1 — `.env.local` in the Next app folder** (same folder as `package.json`):

```env
NEXT_PUBLIC_OBSERVER_URL=http://localhost:8001
NEXT_PUBLIC_OBSERVER_SNIPPET_KEY=tk_smart_YOUR_SAME_KEY_AS_STEP_0
```

**Step 2 — Stop and restart** `npm run dev` (env vars are read at startup).

**Step 3 — In Next `layout.tsx`**, use `||` not `??` for the Observer URL (see §1 below). Remove any fake `/tracker.js` script in `<head>`.

**Step 4 — Browser on Next** (e.g. `http://localhost:3000`): DevTools → Network → confirm **`track.js`** loads from **port 8001**, then **`track`** POST is **200**.

---

Common reasons events never show in the Observer viewer, and a layout pattern that works reliably.

## 1. Wrong script URL (empty `NEXT_PUBLIC_OBSERVER_URL`)

In JavaScript, `process.env.NEXT_PUBLIC_OBSERVER_URL ?? "http://localhost:8001"` does **not** fall back when the value is an **empty string** `""` (empty is not `null`/`undefined`).

Then:

```tsx
src={`${OBSERVER_URL}/static/snippet/track.js?key=...`}
```

becomes **`/static/snippet/track.js?key=...`** — loaded from your **Next app** (port 3000), not Observer (8001). The file is usually missing → snippet never runs correctly.

**Fix:** use `||` so empty string falls back:

```tsx
const OBSERVER_URL =
  process.env.NEXT_PUBLIC_OBSERVER_URL?.trim() ||
  "http://localhost:8001";
```

Restart `next dev` after changing `.env.local`.

## 2. Duplicate `<script>` in `<head>`

Remove stray tags like:

```html
<script src="/tracker.js?key=demo-store-001" defer async />
```

unless that file is really your Observer bundle. `demo-store-001` is **not** a valid tier key (`tk_basic_*` / `tk_smart_*` / `tk_full_*`).

Load **only** the Observer script from your Observer host (see below).

## 3. Content-Security-Policy (CSP)

If `next.config` or headers set `connect-src` without your Observer origin, the browser **blocks** `fetch` to `http://localhost:8001/track`.

**Fix:** add Observer origin to `connect-src` (and `script-src` for the script URL if you lock scripts down).

## 4. API key allowlist on the server

If Observer’s `.env` has `OBSERVER_API_KEYS=...`, the key must match **exactly**. Otherwise every POST returns **401** and nothing is stored.

## 5. Ad blockers

Some block `/track`. Observer also exposes **`POST /collect`** (same handler). You can fork `track.js` to post to `/collect` instead of `/track`, or use a reverse proxy path.

## 6. Recommended `app/layout.tsx` pattern

Use **`beforeInteractive`** to set globals (so they exist before `track.js` runs), then load the snippet with **`afterInteractive`**:

```tsx
import Script from "next/script";

const OBSERVER_URL =
  process.env.NEXT_PUBLIC_OBSERVER_URL?.trim() ||
  "http://localhost:8001";

const OBSERVER_SNIPPET_KEY =
  process.env.NEXT_PUBLIC_OBSERVER_SNIPPET_KEY?.trim() ||
  "tk_smart_REPLACE_ME";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <Script id="observer-config" strategy="beforeInteractive">
          {`window.__OBSERVER_BASE__=${JSON.stringify(OBSERVER_URL)};window.__OBSERVER_API_KEY__=${JSON.stringify(OBSERVER_SNIPPET_KEY)};`}
        </Script>
        <Script
          src={`${OBSERVER_URL}/static/snippet/track.js?key=${encodeURIComponent(OBSERVER_SNIPPET_KEY)}`}
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
```

`track.js` reads `window.__OBSERVER_BASE__` and `window.__OBSERVER_API_KEY__` so the ingest URL and key stay correct even when `document.currentScript` is unreliable.

## 7. Debug failed POSTs

In the browser console:

```js
window.__OBSERVER_DEBUG__ = true;
```

Then reload. Failed `fetch` to `/track` logs a warning.

## 8. Phone / LAN testing

The **page** must load `track.js` from a URL the phone can reach (your PC’s LAN IP, not `localhost` on the phone). Set:

`NEXT_PUBLIC_OBSERVER_URL=http://192.168.x.x:8001`

and open the Next app via the same kind of host (or tunnel).

## 9. Verify quickly

1. DevTools → **Network**: `track.js` status **200**, response is JS from port **8001**.
2. **Network**: `track` or preflight — **200** (not blocked, not 401).
3. Observer terminal: `POST /track HTTP/1.1" 200`.
