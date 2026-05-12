# KICKLAB — Sneaker Store

Premium dark-mode-first e-commerce demo built with **Next.js (App Router)**, **PostgreSQL**, **Prisma**, and **NextAuth**. It includes a public storefront (browse, search, product detail, client-side cart, checkout), authenticated customer areas, and a **Vault-style admin** for catalog management.

---

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Application structure](#application-structure)
- [User flows](#user-flows)
- [Authentication & admin](#authentication--admin)
- [API routes](#api-routes)
- [Environment variables](#environment-variables)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Design & references](#design--references)
- [Production notes](#production-notes)

---

## Architecture

```mermaid
flowchart TB
  subgraph client [Browser]
    Pages[Next.js pages RSC + client components]
    Cart[Zustand cart persist localStorage]
    Pages --> Cart
  end

  subgraph next [Next.js server]
    RSC[Server Components + Route Handlers]
    Auth[NextAuth API route]
  end

  subgraph data [Data layer]
    Prisma[Prisma Client + pg adapter]
    PG[(PostgreSQL)]
    Prisma --> PG
  end

  client --> RSC
  client --> Auth
  RSC --> Prisma
  Auth --> Prisma
```

- **Rendering:** Server Components load catalog and orders from the database; interactive pieces (cart, add-to-cart, admin forms) use client components.
- **Cart:** **Not** stored in Postgres for guests — **Zustand** with `persist` keeps line items in the browser. Checkout **POST** `/api/orders` validates products and **per-size stock** on the server, then creates an order and decrements `ProductSize.stock`.
- **Auth:** **NextAuth** with JWT sessions. Credentials provider for email/password users; optional Google OAuth if env vars are set. Session carries `role` for admin checks.
- **Database access:** Single shared `PrismaClient` in [`src/lib/prisma.ts`](src/lib/prisma.ts) using the **`@prisma/adapter-pg`** driver pool.

---

## Tech stack

| Layer | Choice |
|--------|--------|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS v4, global tokens in [`src/app/globals.css`](src/app/globals.css) |
| Fonts | Inter, Space Grotesk, DM Mono (`next/font`) |
| ORM | Prisma 7 + PostgreSQL |
| Auth | NextAuth v4 + Prisma Adapter |
| Validation | Zod |
| Client state | Zustand (cart) |

---

## Data model

High-level entities (see [`prisma/schema.prisma`](prisma/schema.prisma) for the full schema):

**Catalog (normalized)**

- **Brand** — one per product (`Product.brandId`).
- **Category**, **Gender**, **Color** — many-to-many via `ProductCategory`, `ProductGender`, `ProductColor`.
- **ShoeSize** — canonical EU row (optional `usLabel`).
- **ProductSize** — `(productId, shoeSizeId)` with **per-size `stock`**. Total availability is the sum of these rows; checkout and PDP use this, not a single product-level stock field.

**Commerce**

- **User**, **Order**, **OrderItem** (line snapshots: `size`, `color`, `price`, `quantity`).
- **CartItem** / **WishlistItem** (for logged-in users, if wired from UI).
- **Coupon**, reviews, addresses, etc.

**Integers for money** (e.g. `price`, `totalPrice`) are stored in the app’s minor unit (e.g. tögrög as whole numbers).

---

## Application structure

```
src/
  app/                    # App Router routes
    page.tsx              # Home
    products/             # Collection + PDP (slug in [id])
    search/
    cart/, checkout/
    order/[id]/
    account/, login/, register/
    admin/                # Admin shell + products, taxonomy, orders, …
    api/                  # REST-style route handlers
  components/
    layout/               # Navbar, Footer, …
    admin/                # Product form, etc.
  lib/
    prisma.ts, auth.ts, admin.ts, env-admin.ts, slug.ts, …
  store/
    cart.ts               # Zustand + persist
prisma/
  schema.prisma
  seed.cjs                # DB seed (catalog + reviews)
  backfill-catalog.cjs    # Legacy → relational catalog (if needed)
public/
  uploads/                # Admin image uploads (.gitignored except .gitkeep)
  tracker.js              # Optional local demo hooks (CartTracker); not loaded by default — see docs/NEXTJS_OBSERVER.md
```

---

## User flows

1. **Browse** — `/products` with URL query filters (`brand`, `gender`, `color`, `size`, `onSale`, `sort`, `page`). Filters map to Prisma relations (brand slug/name, gender slug, etc.).
2. **Product** — `/products/[slug]` loads product with brand, colors, and sizes with stock; **Add to cart** pushes into Zustand.
3. **Cart** — `/cart` reads the persisted store; totals are client-side until checkout.
4. **Checkout** — `/checkout` collects address/payment placeholders and calls **`POST /api/orders`**, which re-checks stock and prices, applies coupons if valid, and creates **`Order`** + **`OrderItem`** rows while decrementing **`ProductSize.stock`**.
5. **Account / orders** — Depends on session; order detail at `/order/[id]`.

---

## Authentication & admin

### Customer login

- **`/login`** — Credentials (email + password) against **`User`** rows with bcrypt-hashed `password`.
- After login, admins are redirected to **`/admin`**; others to **`/account`** (see [`src/app/login/page.tsx`](src/app/login/page.tsx)).

### Environment-based “Vault” admin (no DB user)

If **`ADMIN_EMAIL`** and **`ADMIN_PASSWORD`** are set, the same login form can sign in a synthetic admin user (fixed internal id) with **`role: admin`**. Use a strong password; treat like production secrets.

### Database admin

Users with **`User.role === "admin"`** in PostgreSQL also pass **`requireAdminUser()`** ([`src/lib/admin.ts`](src/lib/admin.ts)).

### Admin UI (not linked in the public nav)

- **`/admin`** — Dashboard counts.
- **`/admin/products`** — Table, edit, remove (soft-deactivate if order history blocks delete).
- **`/admin/products/new`**, **`/admin/products/[id]/edit`** — Full product editor (brand, multi category/gender/color, per-size stock, images URL + upload).
- **`/admin/taxonomy`** — CRUD for brands, categories, genders, colors, shoe sizes.
- **`/admin/orders`**, **`/admin/coupons`**, **`/admin/analytics`** — Operational pages.

Admin routes are wrapped by [`src/app/admin/layout.tsx`](src/app/admin/layout.tsx): must be logged in and pass **`requireAdminUser`**.

---

## API routes

| Area | Examples |
|------|-----------|
| Auth | `/api/auth/[...nextauth]` |
| Catalog (public) | `GET /api/products`, `GET /api/products/[id]` |
| Checkout | `POST /api/orders` |
| Admin | `GET /api/admin/catalog-options`, `POST /api/admin/upload`, `POST/PATCH/DELETE /api/admin/products`, `POST/PATCH/DELETE /api/admin/taxonomy/[resource]/…` |
| Other | Register, wishlist, cart stub, admin metrics/coupons, order status helpers |

All **admin** write routes guard with **`requireAdminUser()`**.

---

## Environment variables

Create **`.env`** or **`.env.local`** in the project root (both are gitignored by default).

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string for Prisma and seed scripts. |
| `NEXTAUTH_SECRET` | **Yes** (prod) | Secret for signing JWT sessions. Generate a long random string. |
| `NEXTAUTH_URL` | Recommended in prod | Canonical site URL (e.g. `https://yourdomain.com`). Helps callbacks and OAuth. |
| `ADMIN_EMAIL` | No | With `ADMIN_PASSWORD`, enables env-only admin login. |
| `ADMIN_PASSWORD` | No | Plaintext comparison in dev-style setup; use a long random value. |
| `GOOGLE_CLIENT_ID` | No | Enable Google sign-in (with `GOOGLE_CLIENT_SECRET`). |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret. |
| `NEXT_PUBLIC_OBSERVER_URL` | No | Observer snippet host (default `http://localhost:8001` if unset or empty). See [`docs/NEXTJS_OBSERVER.md`](docs/NEXTJS_OBSERVER.md) and [`src/app/layout.tsx`](src/app/layout.tsx). |
| `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY` | No | Observer `track.js` key. **Tier 1** delegated `data-ca` clicks require a **`tk_full_*`** key. Default matches the previous dev **`tk_smart_*`** key (T2/T3); set `tk_full_…` in production when you need commerce click attributes. Empty env values fall back to defaults. |

### Observer: Tier 1 (`data-ca`) vs Tier 2

- **Tier 2** adds URL/snippet-derived fields (e.g. `detected_page_type`, `product_slug`, `search_query_from_url`, filters). Collection query params use `brand`, `gender`, `color`, `size`, `onSale`, `sort` — they may not map 1:1 to doc names like `filter_value` / `sort_value` until aliases exist.
- **Tier 1** reads `data-ca` and optional `data-ca-*` attributes on clicks. This store emits events including: `cart_add`, `wishlist_add`, `size_guide_open`, `cart_remove`, `cart_update_qty`, `coupon_apply`, `continue_shopping`, `checkout_start`, `checkout_step` (shipping / payment / review), `purchase`. Product list/search/home cards expose **`data-product-id`** on PDP links.
- **`window._ca_user`** is updated client-side ([`src/components/CaCommerceSync.tsx`](src/components/CaCommerceSync.tsx)) with `cart_value`, `cart_item_count`, `is_logged_in`.
- **Order confirmation** route is **`/order/[id]`** — it may not match all Observer “order success” URL heuristics; [`OrderObserverPurchase`](src/app/order/[id]/OrderObserverPurchase.tsx) calls `window._ca.sendPurchase` once per order (deduped) when the snippet exposes it, in addition to checkout success.

**Example (local only):**

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sneakerstore"
NEXTAUTH_SECRET="replace-with-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
# Optional Vault admin:
# ADMIN_EMAIL="admin@example.com"
# ADMIN_PASSWORD="your-strong-secret"
```

---

## Getting started

### Prerequisites

- **Node.js** 20+ recommended  
- **PostgreSQL** running locally or hosted  
- **npm** (or pnpm/yarn with equivalent commands)

### Install

```bash
npm install
```

### Database

Apply the schema to your database (pick one workflow):

```bash
# Dev-friendly sync (no migration history file)
npx prisma db push

# Or tracked migrations
npm run prisma:migrate
```

Generate the client (usually automatic after push/migrate):

```bash
npm run prisma:generate
```

### Seed sample data

```bash
npm run prisma:seed
```

This clears related tables and inserts the 500-product catalog from [`sneaker_store_500_products.json`](sneaker_store_500_products.json) with full taxonomy and **ProductSize** rows. The seed converts `priceUsd` to integer Mongolian tögrög using a fixed `3500 MNT/USD` rate, applies `discountPercent` to `salePrice`, and assigns remote Pexels sneaker image URLs that are allowed by [`next.config.ts`](next.config.ts).

### If upgrading from an older schema

If you still had legacy `Product` columns and used a transitional schema, run:

```bash
npm run catalog:backfill
```

(Loads `.env` / `.env.local` via the script’s dotenv requires.) Then align schema with [`prisma/schema.prisma`](prisma/schema.prisma) and **`prisma db push`** as needed.

### Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run prisma:generate` | `prisma generate` |
| `npm run prisma:migrate` | `prisma migrate dev` |
| `npm run prisma:seed` | Run [`prisma/seed.cjs`](prisma/seed.cjs) |
| `npm run catalog:backfill` | Run [`prisma/backfill-catalog.cjs`](prisma/backfill-catalog.cjs) |

---

## Design & references

- **Product design tokens and rules:** [`DESIGN.md`](DESIGN.md) at the repo root (KICKLAB / “Digital Vault” direction).
- **Stitch HTML references:** Folders such as `stitch/`, `stitch (1)` … `stitch (7)/` and `stitch_cart_drawer_kicklab*` — `code.html` + `DESIGN.md` per folder for layout and styling cues; admin/login surfaces follow the **Vault** stitch set.

---

## Production notes

1. **Secrets:** Never commit `.env`. Use platform env injection and rotate `NEXTAUTH_SECRET` and admin credentials.
2. **Uploads:** Admin images go to **`public/uploads/`**. For serverless or multi-instance hosting, move **`POST /api/admin/upload`** to object storage (S3, R2, Vercel Blob) and store returned URLs in `Product.images`.
3. **Database:** Use connection pooling (e.g. PgBouncer) and a stable `DATABASE_URL` for Prisma.
4. **`next-env.d.ts`:** This repo may ignore it in `.gitignore`; if TypeScript complains on a fresh clone, run `next dev` once or stop ignoring and commit the generated file.
5. **Analytics:** Observer `track.js` from [`src/app/layout.tsx`](src/app/layout.tsx) with `beforeInteractive` globals — see [`docs/NEXTJS_OBSERVER.md`](docs/NEXTJS_OBSERVER.md). Optional `public/tracker.js` (`CartTracker`) is not injected by default.

---

## License

Private project (`"private": true` in `package.json`). Adjust as needed for your deployment.
