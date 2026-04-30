# Cyber-Market — Design Spec

**Date**: 2026-04-30
**Owner**: John Tran
**Status**: Approved (pending implementation plan)

## 1. Overview

`cyber-market` is a UI-focused Next.js marketplace demo themed as a **cyberpunk × mythology fusion** — set in year 2185, where mega-corporations mine ancient mythological relics and sell them as tech-augmented weapons. The app simulates a complete shopping experience (browse, filter, detail, cart, checkout, profile, seller dashboard, order history) backed by an in-memory mock API. There is no real authentication or payment; the goal is to flex the visual capabilities of the `@rintran720/cyberpunk-ui` library across realistic e-commerce flows.

### Goals

- Showcase the cyberpunk-ui component library across a coherent multi-page experience.
- Provide a "real-feeling" marketplace UX with loading/error/empty states.
- Make 8 pages worth of content navigable, interactive, and visually distinctive.

### Non-goals

- Real authentication, real payments, real persistence beyond server runtime.
- Mobile-first or polished sub-768px responsive behavior.
- Production observability, analytics, SEO per-item, i18n, PWA.
- High test coverage; comprehensive e2e.

## 2. Decisions summary

| Aspect | Decision |
|---|---|
| World concept | Cyberpunk × Mythology (year 2185, neon, glitch, mega-corp dystopia) |
| Stack | Next.js 15 (App Router) · TypeScript · Tailwind v4 · `@rintran720/cyberpunk-ui` · SWR |
| Pages | 8 pages (Home, Browse, Item Detail, Cart, Checkout, Profile, Seller, Orders) |
| Item categories | Weapons only — sub-categories: melee, ranged, energy-divine, cursed, 1of1 |
| Currency | `⟁ NEON` crypto-style with wallet, fake tx-hash, in-app balance |
| Auth | None; hardcoded user "John Tran" |
| Seller flow | Full 4-step create flow: category → media → price/stats → preview/publish |
| API approach | Full mock — every entity through Next.js Route Handlers, in-memory store, simulated latency + error rate |
| Seed scale | 40 weapons (`weapons.json`), 6 historical orders (`orders.json`), 8 active listings (`listings.json`), wallet `⟁ 250,000 NEON` |

## 3. Architecture & folder structure

```
cyber-market/
├── app/
│   ├── layout.tsx                 # cp-root cp-grid-bg, header, ticker, toaster, footer
│   ├── page.tsx                   # Home
│   ├── browse/
│   │   ├── page.tsx               # Listing with filter sidebar
│   │   └── [slug]/page.tsx        # Item Detail
│   ├── cart/page.tsx
│   ├── checkout/page.tsx
│   ├── profile/page.tsx           # Inventory + viewed history (tabs)
│   ├── seller/
│   │   ├── page.tsx               # Dashboard
│   │   └── new/page.tsx           # 4-step create stepper
│   ├── orders/page.tsx            # Timeline
│   ├── error.tsx                  # Root error boundary (HUD reticle)
│   └── api/
│       ├── items/route.ts                # GET list + filter
│       ├── items/[slug]/route.ts         # GET single
│       ├── cart/route.ts                 # GET, POST add, DELETE clear
│       ├── cart/[slug]/route.ts          # PATCH qty, DELETE remove
│       ├── checkout/route.ts             # POST → tx-hash + delay
│       ├── wallet/route.ts               # GET balance, POST topup (debug)
│       ├── orders/route.ts               # GET user orders
│       ├── listings/route.ts             # GET seller listings, POST create
│       └── stats/route.ts                # GET seller stats
├── components/
│   ├── layout/                    # Header, Footer, Sidebar, Toaster
│   ├── item/                      # ItemCard, ItemGrid, RarityBadge, PriceTag
│   ├── filters/                   # SearchBox, SubCategoryFilter, RarityFilter, PriceRangeSlider, SortSegmented
│   ├── cart/                      # CartLine, CartDrawer, MiniCart, QtyStepper
│   ├── seller/                    # StepperShell, Step1..Step4, ListingRow, StatsBar
│   ├── feedback/                  # Skeleton variants, ErrorState, EmptyState, TickerTape
│   └── decorative/                # NeonHeading, ScanlineOverlay, HudCorners, RadarMini
├── lib/
│   ├── api/                       # Server-only
│   │   ├── store.ts               # Module-level in-memory singletons
│   │   ├── seed/weapons.json      # 40 weapons
│   │   ├── seed/orders.json
│   │   ├── seed/listings.json
│   │   ├── delay.ts               # rand 300–800ms
│   │   └── error.ts               # ApiError + maybeError(rate)
│   ├── client/                    # Browser-only
│   │   ├── fetcher.ts             # SWR fetcher + ClientApiError
│   │   ├── hooks/                 # useItems, useItem, useCart, useWallet, useCheckout, useOrders, useListings, useStats
│   │   └── types.ts               # Shared TS types (also imported by route handlers)
│   └── format.ts                  # formatNeon, formatTxHash, formatRelativeTime
├── public/items/                  # 40 weapon images (placeholder or stock)
├── tailwind.config.ts             # uses cyberpunk-ui preset
└── app/globals.css                # @import "tailwindcss"; @import "@rintran720/cyberpunk-ui";
```

### Boundaries

- `lib/api/*` is server-only; never imported by client components.
- `lib/client/*` is browser-only; never imported by route handlers.
- `lib/client/types.ts` holds shared TS types and IS imported by both sides — type-only imports.
- Module-level in-memory store resets on server restart (acceptable trade-off for demo).

## 4. Mock API & data schema

### Entity types (`lib/client/types.ts`)

```ts
type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' | 'unique';
type SubCategory = 'melee' | 'ranged' | 'energy-divine' | 'cursed' | '1of1';

// Invariant: items with subCategory === '1of1' MUST have rarity === 'unique' and stock === 1.
// Other sub-categories can have any rarity except 'unique'.

type Weapon = {
  slug: string;                   // 'mjolnir-exe'
  name: string;                   // 'MJOLNIR.exe'
  subCategory: SubCategory;
  rarity: Rarity;
  priceNeon: number;
  seller: string;                 // 'norse-arsenal-corp'
  origin: string;                 // 'Norse mythology'
  imageUrl: string;
  stats: { damage: number; speed: number; range: number; soulCost: number };
  lore: string;
  stock: number;                  // 0 for 1of1 once sold
  tags: string[];
  createdAt: string;              // ISO
};

type CartLine = { itemSlug: string; qty: number; addedAt: string };
type Wallet   = { balanceNeon: number; address: string };
type Order    = {
  id: string;
  txHash: string;
  lines: CartLine[];
  total: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
};
type Listing = Weapon & { views: number; sales: number; revenue: number };
type SellerStats = {
  totalRevenue: number;
  totalSales: number;
  activeListings: number;
  topItem: string;
};
```

### Endpoints

| Method | Path | Body / Query | Response |
|---|---|---|---|
| GET | `/api/items` | `?subCategory&rarity&minPrice&maxPrice&q&sort&page` | `{ items: Weapon[], total, page, pageSize }` |
| GET | `/api/items/[slug]` | — | `Weapon` or 404 |
| GET | `/api/cart` | — | `{ lines, items, subtotal, fee, total }` |
| POST | `/api/cart` | `{ slug, qty }` | `{ lines, items, subtotal, fee, total }` |
| PATCH | `/api/cart/[slug]` | `{ qty }` | `{ lines, items, subtotal, fee, total }` |
| DELETE | `/api/cart/[slug]` | — | `{ lines, items, subtotal, fee, total }` |

`fee = round(subtotal * 0.02)` (2% blockchain fee), `total = subtotal + fee`. Computed server-side so cart and checkout stay in sync.
| GET | `/api/wallet` | — | `Wallet` |
| POST | `/api/checkout` | — | `{ order: Order, wallet: Wallet }` |
| GET | `/api/orders` | — | `Order[]` |
| GET | `/api/listings` | — | `Listing[]` (John Tran's only) |
| POST | `/api/listings` | `Omit<Weapon, 'slug' | 'createdAt'>` | `Listing` |
| GET | `/api/stats` | — | `SellerStats` |

### Latency & error simulation

```ts
// lib/api/delay.ts
export const delay = (min = 300, max = 800) =>
  new Promise(r => setTimeout(r, min + Math.random() * (max - min)));

// lib/api/error.ts
export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}
export const maybeError = (rate = 0.05) => {
  if (Math.random() < rate) throw new ApiError(503, 'ICE_INTERFERENCE', 'Network ICE detected. Retry.');
};
```

- **GET endpoints**: `delay(300, 800)` + 5% chance `503 ICE_INTERFERENCE`.
- **POST/PATCH/DELETE (non-checkout)**: `delay(400, 900)` + 3% chance `503`.
- **POST `/api/checkout`**: `delay(1200, 1800)` + 8% chance of either `402 INSUFFICIENT_NEON` (when balance is genuinely insufficient — deterministic) or `503 BLOCKCHAIN_CONGESTION` (random).
- Error response shape: `{ error: { code, message, retryAfter? } }`.

## 5. Frontend data layer

### SWR setup

`SWRConfig` at root: `revalidateOnFocus: false`, `shouldRetryOnError: true`, `errorRetryCount: 2`, `errorRetryInterval: 800`, `dedupingInterval: 2000`.

```ts
// lib/client/fetcher.ts
export class ClientApiError extends Error {
  constructor(public status: number, public code: string, message?: string) { super(message ?? code); }
}
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ClientApiError(res.status, body.error?.code ?? 'UNKNOWN', body.error?.message);
  }
  return res.json();
};
```

### Hooks (`lib/client/hooks/`)

| Hook | Endpoint | Returns |
|---|---|---|
| `useItems(filters)` | `/api/items?...` | `{ items, total, isLoading, error }` |
| `useItem(slug)` | `/api/items/[slug]` | `{ item, isLoading, error }` |
| `useCart()` | `/api/cart` | `{ cart, addItem, updateQty, removeItem, clear, isLoading, isMutating }` |
| `useWallet()` | `/api/wallet` | `{ wallet, isLoading }` |
| `useCheckout()` | `/api/checkout` | `{ checkout, isProcessing, lastTx }` |
| `useOrders()` | `/api/orders` | `{ orders, isLoading }` |
| `useListings()` | `/api/listings` | `{ listings, createListing, isLoading }` |
| `useStats()` | `/api/stats` | `{ stats, isLoading }` |

Mutation pattern: SWR `mutate()` with optimistic data + rollback on error.

```ts
const addItem = async (slug: string, qty = 1) => {
  await mutate(
    fetch('/api/cart', { method: 'POST', body: JSON.stringify({ slug, qty }) }).then(r => r.json()),
    {
      optimisticData: c => ({ ...c, lines: [...c.lines, { itemSlug: slug, qty, addedAt: now() }] }),
      rollbackOnError: true,
    }
  );
};
```

### Loading/Error/Empty patterns

| State | Component / Class |
|---|---|
| Initial loading list | Skeleton grid (8 cards) using `cp-skeleton` |
| Initial loading detail | Skeleton stack (image + paragraph + stat row) |
| Background revalidate | `animate-cp-pulse` overlay on cards |
| Mutation in flight | Disabled button + inline `cp-spinner--bars` |
| Error 503 | `cp-toast cp-toast--danger` with retry action |
| Error 402 (insufficient) | `cp-modal cp-modal--magenta` with topup CTA |
| Empty | `cp-empty cp-empty--purple` with lore-flavored copy |

Page-level error boundary (`app/error.tsx`) renders a HUD reticle screen with retry + return-to-home.

## 6. Page designs (8 pages)

### Shared layout

- Sticky header: brand logo + 4 nav links + search + wallet widget + avatar
- TickerTape directly under header, scrolling activity events
- Toaster top-right, `cp-grid-bg cp-scanlines` body background, footer with status pill

### 6.1 Home (`/`)

Hero: glitch heading "ARSENAL OF MYTHS" (1× on mount); featured `cp-radar` with random blips; 3 `cp-stat` HUDs (total weapons / volume 24h / active sellers); 4-col "TRENDING" grid; 3-col "NEW DROPS"; banner promo footer.

### 6.2 Browse (`/browse`)

Sidebar 280px: `SearchBox` (debounced 300ms), `SubCategoryFilter` (5 checkboxes with counts), `RarityFilter` (6 radio with rarity colors), `PriceRangeSlider` (dual-thumb 0–1.5M), `SortSegmented` (newest / price asc / price desc / rarity), reset button.
Main: pagination 24/page, `ItemGrid` with `cp-grid--auto`, hover reveals reticle corners.

### 6.3 Item Detail (`/browse/[slug]`)

Two columns. Left: large image with `cp-hud cp-hud--brackets cp-hud--scan` overlay. Right: glitch heading (item name), rarity badge, price gauge (vs. median), `StatGrid` of 4 stat HUDs, tabs (Lore / Compatibility / Reviews / History). Sticky bottom: ADD TO CART button (rarity color) + qty stepper + stock indicator.

### 6.4 Cart (`/cart`)

`cp-table cp-table--striped` columns: image, name, rarity, qty stepper, unit price, line total, remove. Sticky right rail: subtotal, blockchain fee 2%, total, PROCEED TO CHECKOUT. Empty: `cp-empty` with "No weapons in cache" copy.

### 6.5 Checkout (`/checkout`)

`cp-stepper` with 3 steps: Review → Confirm Wallet → Sign. Step 3 opens `cp-modal` containing a `cp-terminal` typewriter sequence (`> handshake...`, `> verifying...`, `> tx confirmed: 0xa4f2...`), then a success modal showing tx-hash and order link.

### 6.6 Profile (`/profile`)

Header: large `cp-avatar--ring--magenta`, "John Tran @ 0xJohnT...4ran", wallet balance gauge.
Tabs: Inventory (purchased items grid with OWNED badge), Recently Viewed, Wishlist (placeholder).

### 6.7 Seller Dashboard (`/seller`)

Top: 4 `StatHUD`s (revenue / sales / active listings / top item). Mid: hand-rolled SVG line chart (sales over 30d) — single neon-stroke polyline + 30 vertical tick marks + start/end labels, no external chart library. Bottom: `cp-table` of listings with views/sales/revenue/status; "+ LIST NEW WEAPON" button → `/seller/new`.

#### Sub-page (`/seller/new`)

`StepperShell` with 4 steps:
1. Category — 5 large clickable cards
2. Media — `cp-dropzone` for image, name input, tags as chips
3. Price & Stats — rarity radio, price input, lore textarea, 4 stat sliders
4. Preview & Publish — final card preview + PUBLISH button → terminal "minting NFT..." → success toast

### 6.8 Orders (`/orders`)

Vertical `cp-timeline`; each node: date, items thumbnail row, total NEON, copyable truncated tx-hash, status badge.

## 7. Visual system

### Rarity-based theming

| Rarity | Token | Hex | Glow |
|---|---|---|---|
| `common` | `cp-fg-muted` | `#8a92a3` | none |
| `rare` | `cp-green-500` | `#39ff14` | `shadow-cp-glow-green` |
| `epic` | `cp-purple-500` | `#bd00ff` | `shadow-cp-glow-purple` |
| `legendary` | `cp-yellow-500` | `#fcee0a` | `shadow-cp-glow-yellow` |
| `mythic` | `cp-cyan-500` | `#00f0ff` | `shadow-cp-glow-cyan` |
| `unique` | `cp-magenta-500` | `#ff00ea` | `shadow-cp-glow-magenta` |

Same color token drives item card border/glow, badge, primary CTA on detail page, and gauge on detail page.

### Typography

- `font-cp-display` — page titles, item names
- `font-cp-mono` — numbers, tx-hash, terminal output, identifiers
- `font-cp-body` — paragraph copy and lore

Heading variants:
- Page title: `cp-heading--xl cp-heading--neon` in page rarity color
- Item name on detail: `cp-heading--lg cp-heading--glitch` with `data-text={name}`, glitch fires once on mount
- Section heading: `cp-heading--md` plain

### Animation rules

| Element | Animation | Trigger |
|---|---|---|
| Hero heading (Home) | `cp-glitch` 1× then settle | Page mount |
| Featured radar blips | continuous sweep (built-in) | Always |
| Item card | scale + glow | Hover |
| Mythic / Unique cards | very subtle `animate-cp-pulse` (3s) | Always |
| Terminal checkout lines | `cp-typewriter` per line | Modal open |
| TickerTape | `cp-marquee` (CSS-only) | Always |
| Skeleton | `animate-cp-shimmer` (built-in) | While loading |
| Stat number changes | count-up 400ms ease-out | Value change |

All animations honor `prefers-reduced-motion` (handled by library).

### Decorative backgrounds

- Body: `cp-grid-bg`
- Home hero: `cp-grid-floor`
- Item Detail image area: `cp-scanlines`
- Modal/Drawer panels: `cp-clip-corner`

### Glow toggle

Header icon ⚡ toggles `<html data-cp-glow="off">`, persisted in `localStorage['cp-glow-pref']`.

## 8. Reusable components

### Item

```tsx
<ItemCard weapon variant="default | compact | wide" showStock onAddToCart? />
<RarityBadge rarity size="sm | md" />
<PriceTag value variant="default | large | strikethrough" />
<StockIndicator stock />
```

### Stats & data display

```tsx
<StatHUD label value max color tooltip? />
<StatGrid stats={Weapon['stats']} />
<GaugeRing value max suffix label />
```

### Wallet & tx

```tsx
<WalletWidget />              // header, balance + dropdown (address, copy, debug topup)
<TxHashLink hash />           // truncated, click-to-copy with toast
<CountUpNumber from to duration format />
```

### Filters

```tsx
<FilterSidebar value onChange>
  <SearchBox debounce={300} />
  <SubCategoryFilter />
  <RarityFilter />
  <PriceRangeSlider min max />
  <SortSegmented options />
  <ResetButton />
</FilterSidebar>
```

### Cart & checkout

```tsx
<QtyStepper value min max onChange />
<CartLine line item />
<CartDrawer open />
<CheckoutTerminal lines onComplete />
```

### Layout & feedback

```tsx
<PageHeader title icon? rarity? />
<Section label>{children}</Section>
<EmptyState icon title desc cta? />
<ErrorState error code retry />
<TickerTape items speed="slow|fast" />
<NeonScanFrame>{children}</NeonScanFrame>
```

### Seller

```tsx
<StepperShell steps current>{children}</StepperShell>
<Step1Category /> <Step2Media /> <Step3PriceStats /> <Step4Preview />
<ListingRow listing />
<StatsBar stats />
```

### Decorative

```tsx
<NeonHeading text level rarity? glitch? />
<ScanlineOverlay opacity={0.05} />
<HudCorners color rarity? />
<RadarMini blips={Array<{x, y, hostile}>} />
```

### Conventions

- All components export TS types; props are camelCase with sensible defaults.
- No component fetches data directly — data flows in via props or hooks invoked by parent.
- Each list/grid component ships a Skeleton sibling (`<ItemCardSkeleton />`, `<CartLineSkeleton />`, etc.).
- A11y baseline: buttons have `aria-label`, modals have `role="dialog"`, status indicators combine icon + text (not color alone).

## 9. Testing, performance, accessibility

### Testing

| Layer | Scope | Tool |
|---|---|---|
| Type check | All files | `tsc --noEmit` (npm script) |
| Unit | `formatNeon`, `formatTxHash`, `applyFilters`, `calcSubtotal` | Vitest |
| Component visual | `ItemCard` per rarity, badges, buttons | Storybook (optional but recommended) |
| Integration | Cart flow happy path: add → update → checkout → order appears | Playwright (1–2 tests) |
| Manual checklist | All 8 pages clickable, key buttons exercised | Markdown checklist in README |

Out of scope: snapshot tests, comprehensive e2e, coverage gates.

### Performance

- Cyberpunk-ui is pure CSS — no runtime JS overhead.
- Use `'use client'` only on pages with interactive state.
- 40 weapon images via `next/image` with explicit `sizes` and a 10×10 colored blur placeholder.
- SWR `dedupingInterval: 2000`, no revalidate on focus.
- Animations are CSS-driven; only one `cp-glitch` on Home runs once at mount; mythic/unique pulse is slow (3s).

### Accessibility

- `:focus-visible` rings (library default).
- Verify AA contrast on `common` rarity (`#8a92a3`) — may require text-shadow or bold weight.
- Decorative elements (TickerTape, Radar, HUD corners): `aria-hidden="true"`.
- Stat HUDs always have visible labels (not glow-only).
- Glitch headings use `data-text` so screen readers read clean text.
- Keyboard support: ↑↓ on qty steppers, Esc closes modals, ⌘K opens command palette.
- Glow toggle persists for users sensitive to neon.

## 10. Definition of Done

1. All 8 pages render and inter-navigate.
2. 40 weapons seed data renders correctly across every rarity tier and sub-category.
3. End-to-end happy path: browse → add to cart → checkout → order in history → tx-hash copyable.
4. Seller create flow: 4 steps complete → new listing appears in dashboard.
5. Loading skeletons, error toasts (with retry), and empty states are demonstrable.
6. Glow toggle works; reduced-motion respected.
7. Type-check passes (`tsc --noEmit` exits 0).
8. Manual checklist passes on Chrome desktop ≥ 768px.
9. README documents `npm install`, `npm run dev`, and a guided 8-page tour.

## 11. Out of scope

- Real auth, real payments, persistent database
- Mobile-first below 768px
- i18n, light theme, PWA, service workers
- High test coverage, full e2e suite
- Per-item SEO, analytics
