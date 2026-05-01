# Cyber-Market — Plan 1: Foundation & Browse

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js 15 project with cyberpunk-ui theme, mock items API serving 40 seed weapons, and a fully working `/browse` listing page with filter sidebar, search, sort, and pagination.

**Architecture:** Next.js 15 App Router project. Mock API via Route Handlers backed by an in-memory module-level singleton store. Frontend uses SWR for data fetching with optimistic patterns coming in later plans. Shared TypeScript types in `lib/client/types.ts` consumed by both server and client. Cyberpunk-ui CSS imported via Tailwind v4's `@import` syntax. UI verified via dev server + a single Playwright smoke test for the browse happy path.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS v4 · `@rintran720/cyberpunk-ui@0.1.0` · SWR 2.x · Vitest · Playwright

**Spec reference:** `docs/superpowers/specs/2026-04-30-cyber-market-design.md` — sections 3, 4, 5, 6.1, 6.2, 7, 8.

**Out of scope (covered in later plans):**
- Home page, Item Detail page (Plan 2)
- Cart, Checkout, Orders, Profile (Plan 3)
- Seller dashboard + create flow (Plan 4)
- Glow toggle, animation polish, a11y audit (Plan 5)

---

## File Structure (created by this plan)

| File | Responsibility |
|---|---|
| `package.json`, `tsconfig.json`, `next.config.ts` | Project config |
| `tailwind.config.ts`, `postcss.config.mjs` | Tailwind v4 + cyberpunk-ui preset |
| `app/globals.css` | Tailwind + cyberpunk-ui imports |
| `app/layout.tsx` | Root layout, body classes, header, footer, ticker, toaster slot |
| `app/page.tsx` | Home placeholder (redirects to `/browse` until Plan 2) |
| `app/error.tsx` | Root error boundary (HUD reticle screen) |
| `app/browse/page.tsx` | Listing page with filter sidebar |
| `app/api/items/route.ts` | GET items list with filter/sort/pagination |
| `lib/client/types.ts` | All shared types (Weapon, Cart, Order, Listing, Wallet, etc.) |
| `lib/client/fetcher.ts` | SWR fetcher + `ClientApiError` |
| `lib/client/hooks/useItems.ts` | Items list hook |
| `lib/api/store.ts` | Module-level in-memory store |
| `lib/api/seed/weapons.json` | 40 weapon entries |
| `lib/api/delay.ts` | Latency simulation |
| `lib/api/error.ts` | `ApiError` + `maybeError` |
| `lib/format.ts` | `formatNeon`, `formatTxHash`, `formatRelativeTime` |
| `components/layout/Header.tsx` | Sticky header with nav, search trigger, wallet placeholder, avatar |
| `components/layout/Footer.tsx` | Footer with status pill |
| `components/decorative/NeonHeading.tsx` | Heading wrapper for neon/glitch styles |
| `components/decorative/HudCorners.tsx` | 4-corner reticle frame |
| `components/feedback/TickerTape.tsx` | Marquee with random activity strings |
| `components/feedback/EmptyState.tsx` | Empty state with `cp-empty` |
| `components/feedback/ErrorState.tsx` | Error state with retry |
| `components/feedback/Skeleton.tsx` | `ItemCardSkeleton` + `ItemGridSkeleton` |
| `components/item/RarityBadge.tsx` | Rarity-coloured badge |
| `components/item/PriceTag.tsx` | NEON price display |
| `components/item/StockIndicator.tsx` | Stock state pill |
| `components/item/ItemCard.tsx` | Catalog tile (default variant only in this plan) |
| `components/item/ItemGrid.tsx` | Responsive grid wrapper |
| `components/filters/SearchBox.tsx` | Debounced search input |
| `components/filters/SubCategoryFilter.tsx` | Sub-category checkboxes |
| `components/filters/RarityFilter.tsx` | Rarity radio group |
| `components/filters/PriceRangeSlider.tsx` | Dual-thumb slider |
| `components/filters/SortSegmented.tsx` | Sort selector |
| `components/filters/FilterSidebar.tsx` | Composes the filter pieces |
| `components/filters/Pagination.tsx` | Page navigation |
| `tests/format.test.ts` | Vitest tests for format utilities |
| `tests/applyFilters.test.ts` | Vitest tests for filter logic |
| `tests/items-api.test.ts` | Vitest tests for items route handler |
| `e2e/browse.spec.ts` | Playwright smoke test |
| `vitest.config.ts`, `playwright.config.ts` | Test runners |
| `.gitignore` | Standard Next.js gitignore |
| `README.md` | Setup + tour instructions |

---

## Task 1: Initialize Next.js 15 project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `app/globals.css`

- [ ] **Step 1: Run `create-next-app` non-interactively**

```bash
cd /Users/johnsmith/Documents/src.nosync/votek/rust_projects/cyber-market
npx create-next-app@15 . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --turbopack \
  --no-install \
  --yes
```

Expected: scaffolding completes, leaves `node_modules` uninstalled.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: install succeeds, no peer-dep errors.

- [ ] **Step 3: Verify dev server boots**

```bash
npm run dev
```

Open http://localhost:3000 — should see default Next.js page. Stop server with Ctrl+C.

- [ ] **Step 4: Initialize git repo and make initial commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js 15 + TS + Tailwind project"
```

---

## Task 2: Install cyberpunk-ui and wire Tailwind v4

**Files:**
- Modify: `app/globals.css`
- Create: `tailwind.config.ts`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Install cyberpunk-ui**

```bash
npm install @rintran720/cyberpunk-ui@0.1.0
```

- [ ] **Step 2: Replace `app/globals.css` contents**

```css
@import "tailwindcss";
@import "@rintran720/cyberpunk-ui";

html {
  background: var(--cp-bg);
  color: var(--cp-fg);
}

body {
  min-height: 100dvh;
}
```

- [ ] **Step 3: Create `tailwind.config.ts` referencing the preset**

```ts
import type { Config } from "tailwindcss";
import cyberpunkPreset from "@rintran720/cyberpunk-ui/tailwind.preset";

const config: Config = {
  presets: [cyberpunkPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
};

export default config;
```

- [ ] **Step 4: Update `app/layout.tsx` to apply cp-root classes**

Replace contents with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeonMarket — Arsenal of Myths",
  description: "Cyberpunk × mythology marketplace, 2185.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme="dark">
      <body className="cp-root cp-grid-bg cp-scanlines">{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: Smoke test theme**

```bash
npm run dev
```

Open http://localhost:3000 — background should be near-black with subtle scan grid (cyberpunk theme active). Stop server.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire cyberpunk-ui theme + Tailwind v4 preset"
```

---

## Task 3: Create shared TypeScript types

**Files:**
- Create: `lib/client/types.ts`

- [ ] **Step 1: Write the full types file**

```ts
// lib/client/types.ts
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic" | "unique";
export type SubCategory = "melee" | "ranged" | "energy-divine" | "cursed" | "1of1";

export type WeaponStats = {
  damage: number;
  speed: number;
  range: number;
  soulCost: number;
};

// Invariant: subCategory === "1of1" ⟹ rarity === "unique" && stock === 1.
export type Weapon = {
  slug: string;
  name: string;
  subCategory: SubCategory;
  rarity: Rarity;
  priceNeon: number;
  seller: string;
  origin: string;
  imageUrl: string;
  stats: WeaponStats;
  lore: string;
  stock: number;
  tags: string[];
  createdAt: string;
};

export type CartLine = { itemSlug: string; qty: number; addedAt: string };

export type CartResponse = {
  lines: CartLine[];
  items: Weapon[];
  subtotal: number;
  fee: number;
  total: number;
};

export type Wallet = { balanceNeon: number; address: string };

export type OrderStatus = "pending" | "confirmed" | "failed";
export type Order = {
  id: string;
  txHash: string;
  lines: CartLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type Listing = Weapon & { views: number; sales: number; revenue: number };
export type SellerStats = {
  totalRevenue: number;
  totalSales: number;
  activeListings: number;
  topItem: string;
};

export type SortKey = "newest" | "price-asc" | "price-desc" | "rarity";

export type ItemFilters = {
  subCategories: SubCategory[];
  rarities: Rarity[];
  minPrice: number;
  maxPrice: number;
  q: string;
  sort: SortKey;
  page: number;
};

export type ItemsResponse = {
  items: Weapon[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiErrorPayload = {
  error: { code: string; message: string; retryAfter?: number };
};
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/client/types.ts
git commit -m "feat: add shared TypeScript types for marketplace entities"
```

---

## Task 4: Format utilities (TDD)

**Files:**
- Create: `lib/format.ts`, `tests/format.test.ts`, `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
npm install -D vitest @vitest/ui
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In the `"scripts"` block of `package.json`, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Write failing tests in `tests/format.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { formatNeon, formatTxHash, formatRelativeTime } from "@/lib/format";

describe("formatNeon", () => {
  it("formats whole numbers with NEON glyph", () => {
    expect(formatNeon(0)).toBe("⟁ 0");
    expect(formatNeon(248000)).toBe("⟁ 248,000");
  });
  it("rounds floats to integer NEON", () => {
    expect(formatNeon(4200.7)).toBe("⟁ 4,201");
  });
  it("supports compact mode for large amounts", () => {
    expect(formatNeon(1_200_000, { compact: true })).toBe("⟁ 1.2M");
    expect(formatNeon(4200, { compact: true })).toBe("⟁ 4.2K");
    expect(formatNeon(900, { compact: true })).toBe("⟁ 900");
  });
});

describe("formatTxHash", () => {
  it("truncates with ellipsis preserving prefix and suffix", () => {
    expect(formatTxHash("0xa4f2b1c08e9d7f1234567890abcdef")).toBe("0xa4f2…cdef");
  });
  it("returns input untouched if shorter than 12 chars", () => {
    expect(formatTxHash("0x1234")).toBe("0x1234");
  });
});

describe("formatRelativeTime", () => {
  it("returns 'just now' for < 60s ago", () => {
    const t = new Date(Date.now() - 30_000).toISOString();
    expect(formatRelativeTime(t)).toBe("just now");
  });
  it("returns minutes ago when under an hour", () => {
    const t = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("5 min ago");
  });
  it("returns hours ago when under a day", () => {
    const t = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("3 h ago");
  });
  it("returns days ago when over a day", () => {
    const t = new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(t)).toBe("2 d ago");
  });
});
```

- [ ] **Step 5: Run tests — expect FAIL**

```bash
npm test -- tests/format.test.ts
```

Expected: all tests fail with "Cannot find module '@/lib/format'".

- [ ] **Step 6: Implement `lib/format.ts`**

```ts
const NEON_GLYPH = "⟁";

export function formatNeon(value: number, opts: { compact?: boolean } = {}): string {
  const v = Math.round(value);
  if (opts.compact) {
    if (Math.abs(v) >= 1_000_000) return `${NEON_GLYPH} ${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (Math.abs(v) >= 1_000) return `${NEON_GLYPH} ${(v / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${NEON_GLYPH} ${v.toLocaleString("en-US")}`;
}

export function formatTxHash(hash: string): string {
  if (hash.length < 12) return hash;
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  const day = Math.floor(hr / 24);
  return `${day} d ago`;
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
npm test -- tests/format.test.ts
```

Expected: all 9 tests pass.

- [ ] **Step 8: Commit**

```bash
git add lib/format.ts tests/format.test.ts vitest.config.ts package.json package-lock.json
git commit -m "feat: add formatNeon/formatTxHash/formatRelativeTime utilities"
```

---

## Task 5: Mock API helpers (delay + error)

**Files:**
- Create: `lib/api/delay.ts`, `lib/api/error.ts`

- [ ] **Step 1: Create `lib/api/delay.ts`**

```ts
export const delay = (min = 300, max = 800): Promise<void> =>
  new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));
```

- [ ] **Step 2: Create `lib/api/error.ts`**

```ts
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export function maybeError(rate = 0.05): void {
  if (Math.random() < rate) {
    throw new ApiError(503, "ICE_INTERFERENCE", "Network ICE detected. Retry.");
  }
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message } },
      { status: err.status },
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: { code: "UNKNOWN", message: "Unexpected error" } },
    { status: 500 },
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add lib/api
git commit -m "feat: add API delay + error helpers for mock simulation"
```

---

## Task 6: In-memory store + 40 weapons seed

**Files:**
- Create: `lib/api/store.ts`, `lib/api/seed/weapons.json`, `public/items/.gitkeep`

- [ ] **Step 1: Create placeholder image directory**

```bash
mkdir -p public/items
touch public/items/.gitkeep
```

- [ ] **Step 2: Create `lib/api/seed/weapons.json` with 40 weapons**

Write 40 weapon entries spread across all 5 sub-categories and 6 rarity tiers. Use `https://picsum.photos/seed/<slug>/600/600` for `imageUrl` so we don't need to provide real images. All `1of1` items must have `rarity: "unique"` and `stock: 1`. Use this exact data:

```json
[
  { "slug": "mjolnir-exe", "name": "MJOLNIR.exe", "subCategory": "energy-divine", "rarity": "mythic", "priceNeon": 4200, "seller": "norse-arsenal-corp", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/mjolnir-exe/600/600", "stats": { "damage": 92, "speed": 60, "range": 35, "soulCost": 40 }, "lore": "Hammer-class divine protocol. Strikes lightning across LAN segments. Forged in the Nine Realms data centre.", "stock": 7, "tags": ["lightning", "hammer", "thor"], "createdAt": "2185-04-12T08:00:00Z" },
  { "slug": "excalibur-dll", "name": "EXCALIBUR.dll", "subCategory": "melee", "rarity": "legendary", "priceNeon": 6200, "seller": "avalon-foundry", "origin": "Arthurian", "imageUrl": "https://picsum.photos/seed/excalibur-dll/600/600", "stats": { "damage": 80, "speed": 75, "range": 12, "soulCost": 30 }, "lore": "Stone-bound longsword library. Loadable only by the rightful heir process.", "stock": 3, "tags": ["sword", "blade", "arthurian"], "createdAt": "2185-03-30T11:30:00Z" },
  { "slug": "gungnir-lance-v3", "name": "GUNGNIR-Lance v3.2", "subCategory": "ranged", "rarity": "legendary", "priceNeon": 5800, "seller": "norse-arsenal-corp", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/gungnir-lance-v3/600/600", "stats": { "damage": 78, "speed": 50, "range": 88, "soulCost": 28 }, "lore": "Auto-targeting spear, never misses its declared payload. Patched twice for memory leak in homing routine.", "stock": 12, "tags": ["spear", "odin", "homing"], "createdAt": "2185-04-01T09:15:00Z" },
  { "slug": "kusanagi-blade", "name": "KUSANAGI.blade", "subCategory": "melee", "rarity": "mythic", "priceNeon": 4800, "seller": "ame-no-cyber", "origin": "Japanese", "imageUrl": "https://picsum.photos/seed/kusanagi-blade/600/600", "stats": { "damage": 88, "speed": 82, "range": 14, "soulCost": 35 }, "lore": "Grass-cutting sword retrieved from the orochi exploit chain.", "stock": 5, "tags": ["sword", "japanese", "wind"], "createdAt": "2185-04-08T15:45:00Z" },
  { "slug": "bow-of-artemis", "name": "BOW-of-ARTEMIS", "subCategory": "ranged", "rarity": "epic", "priceNeon": 2400, "seller": "olympus-armory", "origin": "Greek", "imageUrl": "https://picsum.photos/seed/bow-of-artemis/600/600", "stats": { "damage": 65, "speed": 70, "range": 95, "soulCost": 18 }, "lore": "Lunar bow with auto-tracking arrows. Pairs with night-vision retinal implants.", "stock": 18, "tags": ["bow", "moon", "greek"], "createdAt": "2185-03-22T12:00:00Z" },
  { "slug": "trident-poseidon", "name": "TRIDENT-of-POSEIDON", "subCategory": "energy-divine", "rarity": "legendary", "priceNeon": 7100, "seller": "abyss-marine-tech", "origin": "Greek", "imageUrl": "https://picsum.photos/seed/trident-poseidon/600/600", "stats": { "damage": 86, "speed": 55, "range": 40, "soulCost": 33 }, "lore": "Storm-summoning trident, also functions as wired underwater router.", "stock": 4, "tags": ["trident", "storm", "greek"], "createdAt": "2185-02-18T14:20:00Z" },
  { "slug": "shadow-katar", "name": "SHADOW-katar", "subCategory": "melee", "rarity": "rare", "priceNeon": 850, "seller": "dharma-blade-co", "origin": "Indian", "imageUrl": "https://picsum.photos/seed/shadow-katar/600/600", "stats": { "damage": 55, "speed": 90, "range": 8, "soulCost": 10 }, "lore": "Punching dagger with stealth coating. Field-favourite among netrunners.", "stock": 24, "tags": ["dagger", "stealth"], "createdAt": "2185-04-15T10:00:00Z" },
  { "slug": "blackbow-cursed", "name": "BLACKBOW.cursed", "subCategory": "cursed", "rarity": "epic", "priceNeon": 3300, "seller": "tartarus-trade", "origin": "Greek-cursed", "imageUrl": "https://picsum.photos/seed/blackbow-cursed/600/600", "stats": { "damage": 70, "speed": 65, "range": 70, "soulCost": 55 }, "lore": "Bow strung with hair of the Furies. Each shot drains soul-cost from wielder.", "stock": 6, "tags": ["bow", "cursed", "soul-drain"], "createdAt": "2185-03-05T07:30:00Z" },
  { "slug": "claws-of-anubis", "name": "CLAWS-of-ANUBIS", "subCategory": "melee", "rarity": "epic", "priceNeon": 2100, "seller": "duat-cyberware", "origin": "Egyptian", "imageUrl": "https://picsum.photos/seed/claws-of-anubis/600/600", "stats": { "damage": 72, "speed": 78, "range": 6, "soulCost": 22 }, "lore": "Necropolis-grade fingertip blades. Embeds tracking marker in target souls.", "stock": 9, "tags": ["claws", "egyptian"], "createdAt": "2185-04-02T16:10:00Z" },
  { "slug": "valkyrie-rifle", "name": "VALKYRIE-rifle", "subCategory": "ranged", "rarity": "legendary", "priceNeon": 5400, "seller": "norse-arsenal-corp", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/valkyrie-rifle/600/600", "stats": { "damage": 75, "speed": 68, "range": 90, "soulCost": 25 }, "lore": "Selects worthy targets only. Refuses to fire on the merciful.", "stock": 8, "tags": ["rifle", "norse"], "createdAt": "2185-03-12T13:25:00Z" },
  { "slug": "rune-knuckles", "name": "RUNE-knuckles", "subCategory": "melee", "rarity": "rare", "priceNeon": 720, "seller": "midgard-fab", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/rune-knuckles/600/600", "stats": { "damage": 50, "speed": 85, "range": 4, "soulCost": 8 }, "lore": "Brass knuckles etched with futhark runes. Each hit triggers a brief stun.", "stock": 32, "tags": ["knuckles", "rune"], "createdAt": "2185-04-18T09:00:00Z" },
  { "slug": "fenrir-jaw-pistol", "name": "FENRIR-jaw.pistol", "subCategory": "ranged", "rarity": "epic", "priceNeon": 2700, "seller": "wolf-iron-works", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/fenrir-jaw-pistol/600/600", "stats": { "damage": 68, "speed": 72, "range": 60, "soulCost": 20 }, "lore": "Sidearm carved from the wolf-king's tooth. Bites through armour layers.", "stock": 14, "tags": ["pistol", "wolf"], "createdAt": "2185-04-09T11:00:00Z" },
  { "slug": "lotus-cestus", "name": "LOTUS-cestus", "subCategory": "melee", "rarity": "common", "priceNeon": 220, "seller": "varanasi-light", "origin": "Indian", "imageUrl": "https://picsum.photos/seed/lotus-cestus/600/600", "stats": { "damage": 35, "speed": 68, "range": 4, "soulCost": 4 }, "lore": "Padded fighting glove. Starter-grade.", "stock": 60, "tags": ["glove", "starter"], "createdAt": "2185-04-20T08:00:00Z" },
  { "slug": "phoenix-quiver", "name": "PHOENIX-quiver", "subCategory": "ranged", "rarity": "rare", "priceNeon": 980, "seller": "rebirth-ordnance", "origin": "Multiple", "imageUrl": "https://picsum.photos/seed/phoenix-quiver/600/600", "stats": { "damage": 60, "speed": 70, "range": 78, "soulCost": 14 }, "lore": "Self-replenishing arrow quiver. One spawn every 3 minutes.", "stock": 22, "tags": ["quiver", "phoenix"], "createdAt": "2185-04-14T17:00:00Z" },
  { "slug": "scarab-shuriken", "name": "SCARAB-shuriken", "subCategory": "ranged", "rarity": "common", "priceNeon": 180, "seller": "duat-cyberware", "origin": "Egyptian", "imageUrl": "https://picsum.photos/seed/scarab-shuriken/600/600", "stats": { "damage": 30, "speed": 95, "range": 35, "soulCost": 3 }, "lore": "Beetle-shaped throwing star. Packs of 12.", "stock": 100, "tags": ["throwing", "egyptian"], "createdAt": "2185-04-22T07:30:00Z" },
  { "slug": "vajra-mace", "name": "VAJRA.mace", "subCategory": "energy-divine", "rarity": "epic", "priceNeon": 3100, "seller": "indra-cyberworks", "origin": "Indian", "imageUrl": "https://picsum.photos/seed/vajra-mace/600/600", "stats": { "damage": 76, "speed": 58, "range": 12, "soulCost": 24 }, "lore": "Diamond-thunderbolt mace. Disables nearby drones on impact.", "stock": 11, "tags": ["mace", "thunder"], "createdAt": "2185-03-28T10:00:00Z" },
  { "slug": "anansi-net", "name": "ANANSI.net", "subCategory": "ranged", "rarity": "rare", "priceNeon": 640, "seller": "akan-cyberweb", "origin": "African", "imageUrl": "https://picsum.photos/seed/anansi-net/600/600", "stats": { "damage": 22, "speed": 75, "range": 28, "soulCost": 12 }, "lore": "Spider-silk projectile net. Roots target for 4 seconds.", "stock": 28, "tags": ["net", "trap"], "createdAt": "2185-04-11T14:50:00Z" },
  { "slug": "morrigan-scythe", "name": "MORRIGAN.scythe", "subCategory": "cursed", "rarity": "legendary", "priceNeon": 6800, "seller": "raven-ordnance", "origin": "Celtic", "imageUrl": "https://picsum.photos/seed/morrigan-scythe/600/600", "stats": { "damage": 90, "speed": 52, "range": 16, "soulCost": 60 }, "lore": "Reaper's scythe of the battle-crow. Counts kills, demands tribute.", "stock": 2, "tags": ["scythe", "cursed", "celtic"], "createdAt": "2185-02-28T19:40:00Z" },
  { "slug": "aether-pulse-rifle", "name": "AETHER.pulse-rifle", "subCategory": "energy-divine", "rarity": "epic", "priceNeon": 2900, "seller": "olympus-armory", "origin": "Greek", "imageUrl": "https://picsum.photos/seed/aether-pulse-rifle/600/600", "stats": { "damage": 70, "speed": 75, "range": 80, "soulCost": 22 }, "lore": "Channels primordial sky. Standard issue for sky-faction operatives.", "stock": 10, "tags": ["rifle", "energy"], "createdAt": "2185-04-05T12:30:00Z" },
  { "slug": "amaterasu-flare", "name": "AMATERASU-flare", "subCategory": "energy-divine", "rarity": "mythic", "priceNeon": 5200, "seller": "ame-no-cyber", "origin": "Japanese", "imageUrl": "https://picsum.photos/seed/amaterasu-flare/600/600", "stats": { "damage": 85, "speed": 65, "range": 50, "soulCost": 38 }, "lore": "Solar pistol of the sun goddess. Outshines artificial light at 30m.", "stock": 6, "tags": ["pistol", "solar"], "createdAt": "2185-03-20T08:45:00Z" },
  { "slug": "cu-chulainn-spear", "name": "CU-CHULAINN-spear", "subCategory": "melee", "rarity": "epic", "priceNeon": 3400, "seller": "ulster-tactical", "origin": "Celtic", "imageUrl": "https://picsum.photos/seed/cu-chulainn-spear/600/600", "stats": { "damage": 78, "speed": 70, "range": 22, "soulCost": 26 }, "lore": "Gáe Bolg replica with 30 internal barbs. Single-target finisher.", "stock": 7, "tags": ["spear", "celtic"], "createdAt": "2185-03-18T16:00:00Z" },
  { "slug": "loki-dagger", "name": "LOKI.dagger", "subCategory": "cursed", "rarity": "rare", "priceNeon": 1100, "seller": "shadow-trade-net", "origin": "Norse-cursed", "imageUrl": "https://picsum.photos/seed/loki-dagger/600/600", "stats": { "damage": 58, "speed": 92, "range": 6, "soulCost": 30 }, "lore": "Trickster's dagger. 5% chance to miss intentionally and laugh.", "stock": 16, "tags": ["dagger", "cursed"], "createdAt": "2185-04-07T20:00:00Z" },
  { "slug": "set-curse-rod", "name": "SET-curse.rod", "subCategory": "cursed", "rarity": "epic", "priceNeon": 3700, "seller": "duat-cyberware", "origin": "Egyptian-cursed", "imageUrl": "https://picsum.photos/seed/set-curse-rod/600/600", "stats": { "damage": 64, "speed": 60, "range": 30, "soulCost": 50 }, "lore": "Was-staff of Set. Inflicts sandstorm sight-debuff on hit.", "stock": 5, "tags": ["rod", "cursed"], "createdAt": "2185-03-25T09:30:00Z" },
  { "slug": "feather-of-maat", "name": "FEATHER-of-MAAT", "subCategory": "melee", "rarity": "common", "priceNeon": 95, "seller": "duat-cyberware", "origin": "Egyptian", "imageUrl": "https://picsum.photos/seed/feather-of-maat/600/600", "stats": { "damage": 18, "speed": 88, "range": 3, "soulCost": 2 }, "lore": "Ostrich-feather knife, ceremonial grade. Lightweight.", "stock": 80, "tags": ["knife", "starter"], "createdAt": "2185-04-21T08:00:00Z" },
  { "slug": "sandalwood-sling", "name": "SANDALWOOD-sling", "subCategory": "ranged", "rarity": "common", "priceNeon": 60, "seller": "varanasi-light", "origin": "Indian", "imageUrl": "https://picsum.photos/seed/sandalwood-sling/600/600", "stats": { "damage": 15, "speed": 70, "range": 32, "soulCost": 1 }, "lore": "Wooden sling. Apprentice gear.", "stock": 120, "tags": ["sling", "starter"], "createdAt": "2185-04-23T08:00:00Z" },
  { "slug": "fang-of-jormungandr", "name": "FANG-of-JORMUNGANDR", "subCategory": "melee", "rarity": "mythic", "priceNeon": 4900, "seller": "wolf-iron-works", "origin": "Norse", "imageUrl": "https://picsum.photos/seed/fang-of-jormungandr/600/600", "stats": { "damage": 89, "speed": 70, "range": 10, "soulCost": 36 }, "lore": "Tooth of the world serpent. Venom degrades target armour by 10% per stack.", "stock": 3, "tags": ["dagger", "venom"], "createdAt": "2185-03-10T10:00:00Z" },
  { "slug": "garm-leash", "name": "GARM.leash", "subCategory": "cursed", "rarity": "rare", "priceNeon": 720, "seller": "shadow-trade-net", "origin": "Norse-cursed", "imageUrl": "https://picsum.photos/seed/garm-leash/600/600", "stats": { "damage": 40, "speed": 65, "range": 18, "soulCost": 28 }, "lore": "Hellhound chain whip. Each hit lowers target stamina.", "stock": 13, "tags": ["whip", "cursed"], "createdAt": "2185-04-04T11:00:00Z" },
  { "slug": "boomerang-of-mimi", "name": "BOOMERANG-of-MIMI", "subCategory": "ranged", "rarity": "rare", "priceNeon": 880, "seller": "dreamtime-arms", "origin": "Aboriginal", "imageUrl": "https://picsum.photos/seed/boomerang-of-mimi/600/600", "stats": { "damage": 52, "speed": 80, "range": 50, "soulCost": 8 }, "lore": "Returns to thrower. Bounces off walls twice.", "stock": 20, "tags": ["boomerang"], "createdAt": "2185-04-17T15:00:00Z" },
  { "slug": "tonbogiri-spear", "name": "TONBOGIRI-spear", "subCategory": "melee", "rarity": "legendary", "priceNeon": 5900, "seller": "ame-no-cyber", "origin": "Japanese", "imageUrl": "https://picsum.photos/seed/tonbogiri-spear/600/600", "stats": { "damage": 82, "speed": 64, "range": 24, "soulCost": 28 }, "lore": "Dragonfly cutter. Severs anything that touches its blade.", "stock": 4, "tags": ["spear", "japanese"], "createdAt": "2185-03-15T13:00:00Z" },
  { "slug": "ankh-blade", "name": "ANKH-blade", "subCategory": "melee", "rarity": "rare", "priceNeon": 950, "seller": "duat-cyberware", "origin": "Egyptian", "imageUrl": "https://picsum.photos/seed/ankh-blade/600/600", "stats": { "damage": 56, "speed": 72, "range": 8, "soulCost": 12 }, "lore": "Cross-of-life dagger. Heals user 1 HP per kill.", "stock": 19, "tags": ["dagger"], "createdAt": "2185-04-13T11:30:00Z" },
  { "slug": "nyx-shroud", "name": "NYX-shroud", "subCategory": "cursed", "rarity": "mythic", "priceNeon": 4600, "seller": "tartarus-trade", "origin": "Greek-cursed", "imageUrl": "https://picsum.photos/seed/nyx-shroud/600/600", "stats": { "damage": 60, "speed": 75, "range": 26, "soulCost": 45 }, "lore": "Cape of night that turns into thrown blades on command.", "stock": 4, "tags": ["cloak", "blade"], "createdAt": "2185-03-08T22:00:00Z" },
  { "slug": "starter-blade", "name": "STARTER.blade", "subCategory": "melee", "rarity": "common", "priceNeon": 50, "seller": "midgard-fab", "origin": "Generic", "imageUrl": "https://picsum.photos/seed/starter-blade/600/600", "stats": { "damage": 20, "speed": 65, "range": 5, "soulCost": 1 }, "lore": "Standard tutorial blade. Every netrunner gets one.", "stock": 200, "tags": ["sword", "starter"], "createdAt": "2185-04-25T08:00:00Z" },
  { "slug": "lugh-spear", "name": "LUGH-spear", "subCategory": "energy-divine", "rarity": "legendary", "priceNeon": 6300, "seller": "ulster-tactical", "origin": "Celtic", "imageUrl": "https://picsum.photos/seed/lugh-spear/600/600", "stats": { "damage": 84, "speed": 60, "range": 35, "soulCost": 30 }, "lore": "Solar spear of Lugh. Auto-locks onto exposed power cores.", "stock": 5, "tags": ["spear", "celtic"], "createdAt": "2185-03-19T10:00:00Z" },
  { "slug": "stone-of-scone", "name": "STONE-of-SCONE", "subCategory": "1of1", "rarity": "unique", "priceNeon": 980000, "seller": "vatican-vault-7", "origin": "Celtic", "imageUrl": "https://picsum.photos/seed/stone-of-scone/600/600", "stats": { "damage": 0, "speed": 0, "range": 0, "soulCost": 100 }, "lore": "Coronation stone. Soul-bound. Confers crown-class authority on its owner. Not for combat.", "stock": 1, "tags": ["relic", "1of1"], "createdAt": "2185-01-09T00:00:00Z" },
  { "slug": "spear-of-destiny", "name": "SPEAR-of-DESTINY", "subCategory": "1of1", "rarity": "unique", "priceNeon": 1240000, "seller": "vatican-vault-7", "origin": "Christian", "imageUrl": "https://picsum.photos/seed/spear-of-destiny/600/600", "stats": { "damage": 99, "speed": 70, "range": 30, "soulCost": 80 }, "lore": "Pierces any defence. Recorded last sale: ⟁ 1.18M, two cycles ago.", "stock": 1, "tags": ["spear", "1of1", "relic"], "createdAt": "2184-12-20T00:00:00Z" },
  { "slug": "holy-grail", "name": "HOLY-GRAIL", "subCategory": "1of1", "rarity": "unique", "priceNeon": 1500000, "seller": "vatican-vault-7", "origin": "Arthurian", "imageUrl": "https://picsum.photos/seed/holy-grail/600/600", "stats": { "damage": 0, "speed": 0, "range": 0, "soulCost": 95 }, "lore": "Drinking vessel of revelation. Soul-bound. Effects classified above clearance.", "stock": 1, "tags": ["relic", "1of1"], "createdAt": "2184-11-15T00:00:00Z" },
  { "slug": "trickster-flute", "name": "TRICKSTER.flute", "subCategory": "cursed", "rarity": "rare", "priceNeon": 540, "seller": "akan-cyberweb", "origin": "African-cursed", "imageUrl": "https://picsum.photos/seed/trickster-flute/600/600", "stats": { "damage": 25, "speed": 80, "range": 22, "soulCost": 18 }, "lore": "Bone flute. Confuses target AI for 6 seconds.", "stock": 30, "tags": ["flute", "cursed"], "createdAt": "2185-04-19T17:30:00Z" },
  { "slug": "raiden-rod", "name": "RAIDEN-rod", "subCategory": "energy-divine", "rarity": "rare", "priceNeon": 1080, "seller": "ame-no-cyber", "origin": "Japanese", "imageUrl": "https://picsum.photos/seed/raiden-rod/600/600", "stats": { "damage": 62, "speed": 70, "range": 26, "soulCost": 16 }, "lore": "Thunder god's drumstick. Each strike triggers a crack of localized thunder.", "stock": 17, "tags": ["rod", "thunder"], "createdAt": "2185-04-06T13:00:00Z" },
  { "slug": "cerberus-collar", "name": "CERBERUS.collar", "subCategory": "cursed", "rarity": "epic", "priceNeon": 2600, "seller": "tartarus-trade", "origin": "Greek-cursed", "imageUrl": "https://picsum.photos/seed/cerberus-collar/600/600", "stats": { "damage": 50, "speed": 60, "range": 14, "soulCost": 40 }, "lore": "Three-pronged shock collar. Triple-tap to summon hellhound illusion.", "stock": 8, "tags": ["collar", "cursed"], "createdAt": "2185-03-26T19:00:00Z" }
]
```

- [ ] **Step 3: Create `lib/api/store.ts`**

```ts
import seedData from "./seed/weapons.json";
import type { Weapon } from "@/lib/client/types";

type Store = {
  weapons: Weapon[];
};

const store: Store = {
  weapons: seedData as Weapon[],
};

export const getStore = (): Store => store;

export const getAllWeapons = (): Weapon[] => store.weapons;

export const getWeaponBySlug = (slug: string): Weapon | undefined =>
  store.weapons.find((w) => w.slug === slug);
```

- [ ] **Step 4: Verify import of JSON works (TS config)**

If `tsc --noEmit` complains about JSON import, set `"resolveJsonModule": true` in `tsconfig.json` (Next.js's default already has it; verify).

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Sanity check seed length**

Add a temporary file `tests/seed.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getAllWeapons } from "@/lib/api/store";

describe("seed", () => {
  it("has exactly 40 weapons", () => {
    expect(getAllWeapons()).toHaveLength(40);
  });
  it("all 1of1 sub-cat items have unique rarity and stock=1", () => {
    const ones = getAllWeapons().filter((w) => w.subCategory === "1of1");
    expect(ones.length).toBeGreaterThan(0);
    for (const w of ones) {
      expect(w.rarity).toBe("unique");
      expect(w.stock).toBe(1);
    }
  });
  it("covers every sub-category at least once", () => {
    const cats = new Set(getAllWeapons().map((w) => w.subCategory));
    expect(cats.size).toBe(5);
  });
  it("covers every rarity tier at least once", () => {
    const rarities = new Set(getAllWeapons().map((w) => w.rarity));
    expect(rarities.size).toBe(6);
  });
});
```

- [ ] **Step 6: Run test**

```bash
npm test -- tests/seed.test.ts
```

Expected: all 4 pass. If a sub-category or rarity is missing, fix the seed and rerun.

- [ ] **Step 7: Commit**

```bash
git add lib/api/store.ts lib/api/seed/weapons.json public/items tests/seed.test.ts
git commit -m "feat: seed 40 mythological weapons + in-memory store"
```

---

## Task 7: Items list filter logic (TDD)

**Files:**
- Create: `lib/api/applyFilters.ts`, `tests/applyFilters.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/applyFilters.test.ts
import { describe, it, expect } from "vitest";
import { applyFilters } from "@/lib/api/applyFilters";
import { getAllWeapons } from "@/lib/api/store";

const all = getAllWeapons();

describe("applyFilters", () => {
  it("returns all when no filters provided", () => {
    const r = applyFilters(all, {});
    expect(r.items).toHaveLength(40);
    expect(r.total).toBe(40);
  });

  it("filters by sub-category", () => {
    const r = applyFilters(all, { subCategories: ["1of1"] });
    expect(r.items.every((w) => w.subCategory === "1of1")).toBe(true);
    expect(r.total).toBe(r.items.length);
  });

  it("filters by rarity", () => {
    const r = applyFilters(all, { rarities: ["mythic"] });
    expect(r.items.every((w) => w.rarity === "mythic")).toBe(true);
  });

  it("filters by price range inclusive", () => {
    const r = applyFilters(all, { minPrice: 1000, maxPrice: 3000 });
    expect(r.items.every((w) => w.priceNeon >= 1000 && w.priceNeon <= 3000)).toBe(true);
  });

  it("text search matches name, tags, origin, seller", () => {
    expect(applyFilters(all, { q: "mjolnir" }).items.length).toBe(1);
    expect(applyFilters(all, { q: "norse" }).items.length).toBeGreaterThan(1);
    expect(applyFilters(all, { q: "VATICAN" }).items.length).toBeGreaterThan(0);
  });

  it("sorts by newest (default)", () => {
    const r = applyFilters(all, { sort: "newest" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].createdAt >= r.items[i].createdAt).toBe(true);
    }
  });

  it("sorts by price ascending", () => {
    const r = applyFilters(all, { sort: "price-asc" });
    for (let i = 1; i < r.items.length; i++) {
      expect(r.items[i - 1].priceNeon <= r.items[i].priceNeon).toBe(true);
    }
  });

  it("paginates with pageSize=24", () => {
    const r = applyFilters(all, { page: 1 });
    expect(r.items.length).toBeLessThanOrEqual(24);
    expect(r.pageSize).toBe(24);
    expect(r.page).toBe(1);
  });

  it("clamps page to last page", () => {
    const r = applyFilters(all, { page: 99 });
    // either empty array on overshoot, or returned data — total must equal 40
    expect(r.total).toBe(40);
    expect(r.page).toBe(99);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
npm test -- tests/applyFilters.test.ts
```

Expected: fails with "Cannot find module".

- [ ] **Step 3: Implement `lib/api/applyFilters.ts`**

```ts
import type { ItemFilters, ItemsResponse, Weapon, SortKey } from "@/lib/client/types";

const PAGE_SIZE = 24;

const RARITY_ORDER: Record<string, number> = {
  unique: 6,
  mythic: 5,
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1,
};

export function applyFilters(items: Weapon[], f: Partial<ItemFilters>): ItemsResponse {
  let out = items.slice();

  if (f.subCategories?.length) {
    const set = new Set(f.subCategories);
    out = out.filter((w) => set.has(w.subCategory));
  }
  if (f.rarities?.length) {
    const set = new Set(f.rarities);
    out = out.filter((w) => set.has(w.rarity));
  }
  if (typeof f.minPrice === "number") out = out.filter((w) => w.priceNeon >= f.minPrice!);
  if (typeof f.maxPrice === "number") out = out.filter((w) => w.priceNeon <= f.maxPrice!);

  if (f.q && f.q.trim()) {
    const q = f.q.trim().toLowerCase();
    out = out.filter((w) =>
      w.name.toLowerCase().includes(q) ||
      w.seller.toLowerCase().includes(q) ||
      w.origin.toLowerCase().includes(q) ||
      w.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }

  const sort: SortKey = f.sort ?? "newest";
  out.sort((a, b) => {
    switch (sort) {
      case "newest": return b.createdAt.localeCompare(a.createdAt);
      case "price-asc": return a.priceNeon - b.priceNeon;
      case "price-desc": return b.priceNeon - a.priceNeon;
      case "rarity": return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
    }
  });

  const total = out.length;
  const page = Math.max(1, f.page ?? 1);
  const start = (page - 1) * PAGE_SIZE;
  const paged = out.slice(start, start + PAGE_SIZE);

  return { items: paged, total, page, pageSize: PAGE_SIZE };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/applyFilters.test.ts
```

Expected: all 9 pass.

- [ ] **Step 5: Commit**

```bash
git add lib/api/applyFilters.ts tests/applyFilters.test.ts
git commit -m "feat: add applyFilters with category/rarity/price/search/sort/pagination"
```

---

## Task 8: Items API route handler

**Files:**
- Create: `app/api/items/route.ts`, `tests/items-api.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/items-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/items/route";

// Stub out delay + maybeError for deterministic tests
vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const reqWith = (params: string) =>
  new Request(`http://localhost/api/items${params ? "?" + params : ""}`);

describe("GET /api/items", () => {
  it("returns full first page when no filters", async () => {
    const res = await GET(reqWith(""));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(40);
    expect(body.items.length).toBeLessThanOrEqual(24);
  });

  it("applies subCategory filter from query string (comma-separated)", async () => {
    const res = await GET(reqWith("subCategory=1of1"));
    const body = await res.json();
    expect(body.items.every((w: { subCategory: string }) => w.subCategory === "1of1")).toBe(true);
  });

  it("applies search query", async () => {
    const res = await GET(reqWith("q=mjolnir"));
    const body = await res.json();
    expect(body.items.length).toBe(1);
  });

  it("applies sort=price-asc", async () => {
    const res = await GET(reqWith("sort=price-asc"));
    const body = await res.json();
    for (let i = 1; i < body.items.length; i++) {
      expect(body.items[i - 1].priceNeon).toBeLessThanOrEqual(body.items[i].priceNeon);
    }
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- tests/items-api.test.ts
```

Expected: fails (module not found).

- [ ] **Step 3: Implement `app/api/items/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getAllWeapons } from "@/lib/api/store";
import { applyFilters } from "@/lib/api/applyFilters";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";
import type { ItemFilters, Rarity, SortKey, SubCategory } from "@/lib/client/types";

const VALID_SUB: SubCategory[] = ["melee", "ranged", "energy-divine", "cursed", "1of1"];
const VALID_RARITY: Rarity[] = ["common", "rare", "epic", "legendary", "mythic", "unique"];
const VALID_SORT: SortKey[] = ["newest", "price-asc", "price-desc", "rarity"];

function parseList<T extends string>(raw: string | null, valid: T[]): T[] | undefined {
  if (!raw) return undefined;
  const parts = raw.split(",").map((s) => s.trim()).filter(Boolean) as T[];
  return parts.filter((p) => valid.includes(p));
}

export async function GET(req: Request): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);

    const url = new URL(req.url);
    const sp = url.searchParams;

    const filters: Partial<ItemFilters> = {
      subCategories: parseList<SubCategory>(sp.get("subCategory"), VALID_SUB),
      rarities: parseList<Rarity>(sp.get("rarity"), VALID_RARITY),
      minPrice: sp.has("minPrice") ? Number(sp.get("minPrice")) : undefined,
      maxPrice: sp.has("maxPrice") ? Number(sp.get("maxPrice")) : undefined,
      q: sp.get("q") ?? undefined,
      sort: (sp.get("sort") as SortKey | null) && VALID_SORT.includes(sp.get("sort") as SortKey)
        ? (sp.get("sort") as SortKey)
        : "newest",
      page: sp.has("page") ? Math.max(1, parseInt(sp.get("page")!, 10) || 1) : 1,
    };

    const result = applyFilters(getAllWeapons(), filters);
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npm test -- tests/items-api.test.ts
```

Expected: all 4 pass.

- [ ] **Step 5: Manual smoke test**

```bash
npm run dev
```

```bash
curl -s 'http://localhost:3000/api/items?sort=price-desc&page=1' | head -c 500
```

Expected: JSON with `items[]` whose first element is one of the unique 1/1 relics (highest price). Stop dev server.

- [ ] **Step 6: Commit**

```bash
git add app/api/items/route.ts tests/items-api.test.ts
git commit -m "feat: GET /api/items with filters, sort, and pagination"
```

---

## Task 9: SWR fetcher + useItems hook

**Files:**
- Create: `lib/client/fetcher.ts`, `lib/client/hooks/useItems.ts`

- [ ] **Step 1: Install SWR**

```bash
npm install swr
```

- [ ] **Step 2: Create `lib/client/fetcher.ts`**

```ts
export class ClientApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ClientApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? `Request failed: ${res.status}`,
    );
  }
  return res.json() as Promise<T>;
};
```

- [ ] **Step 3: Create `lib/client/hooks/useItems.ts`**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { ItemFilters, ItemsResponse } from "@/lib/client/types";

function buildQuery(f: Partial<ItemFilters>): string {
  const sp = new URLSearchParams();
  if (f.subCategories?.length) sp.set("subCategory", f.subCategories.join(","));
  if (f.rarities?.length) sp.set("rarity", f.rarities.join(","));
  if (typeof f.minPrice === "number") sp.set("minPrice", String(f.minPrice));
  if (typeof f.maxPrice === "number") sp.set("maxPrice", String(f.maxPrice));
  if (f.q && f.q.trim()) sp.set("q", f.q.trim());
  if (f.sort) sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function useItems(filters: Partial<ItemFilters>) {
  const url = `/api/items${buildQuery(filters)}`;
  const { data, error, isLoading, mutate } = useSWR<ItemsResponse>(url, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 800,
    dedupingInterval: 2000,
  });
  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 24,
    isLoading,
    error,
    mutate,
  };
}
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add lib/client/fetcher.ts lib/client/hooks/useItems.ts package.json package-lock.json
git commit -m "feat: SWR fetcher + useItems hook with query builder"
```

---

## Task 10: Decorative components

**Files:**
- Create: `components/decorative/NeonHeading.tsx`, `components/decorative/HudCorners.tsx`

- [ ] **Step 1: Create `components/decorative/NeonHeading.tsx`**

```tsx
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  level?: "xl" | "lg" | "md" | "sm";
  variant?: "neon" | "glitch" | "plain";
  rarity?: "cyan" | "magenta" | "yellow" | "green" | "purple" | "red";
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
  text?: string; // required when variant="glitch", used for data-text
};

const SIZE_CLASS: Record<NonNullable<Props["level"]>, string> = {
  xl: "cp-heading--xl",
  lg: "cp-heading--lg",
  md: "cp-heading--md",
  sm: "cp-heading--sm",
};

export function NeonHeading({
  children,
  level = "lg",
  variant = "neon",
  rarity = "cyan",
  as: Tag = "h2",
  className = "",
  text,
}: Props) {
  const classes = ["cp-heading", SIZE_CLASS[level]];
  if (variant !== "plain") classes.push(`cp-heading--${variant}`);
  if (variant === "neon") classes.push(`cp-heading--${rarity}`);

  if (variant === "glitch") {
    return (
      <Tag className={`${classes.join(" ")} ${className}`} data-text={text ?? ""}>
        {children}
      </Tag>
    );
  }
  return <Tag className={`${classes.join(" ")} ${className}`}>{children}</Tag>;
}
```

- [ ] **Step 2: Create `components/decorative/HudCorners.tsx`**

```tsx
type Props = {
  color?: "cyan" | "magenta" | "yellow" | "green" | "purple";
  className?: string;
  children?: React.ReactNode;
};

export function HudCorners({ color = "cyan", className = "", children }: Props) {
  return (
    <div className={`cp-hud cp-hud--${color} cp-hud--brackets ${className}`}>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/decorative
git commit -m "feat: add NeonHeading and HudCorners decorative components"
```

---

## Task 11: Feedback components

**Files:**
- Create: `components/feedback/TickerTape.tsx`, `components/feedback/EmptyState.tsx`, `components/feedback/ErrorState.tsx`, `components/feedback/Skeleton.tsx`

- [ ] **Step 1: Create `components/feedback/TickerTape.tsx`**

```tsx
type Props = {
  items: string[];
  speed?: "slow" | "fast";
};

export function TickerTape({ items, speed = "slow" }: Props) {
  const sep = " ▰ ";
  const text = items.join(sep) + sep;
  const dur = speed === "fast" ? "30s" : "60s";
  return (
    <div className="cp-ticker cp-ticker--cyan cp-ticker--fade" aria-hidden="true">
      <div className="cp-ticker__track" style={{ animationDuration: dur }}>
        <div className="cp-ticker__group">
          <span className="cp-ticker__item">{text}</span>
        </div>
        <div className="cp-ticker__group" aria-hidden="true">
          <span className="cp-ticker__item">{text}</span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/feedback/EmptyState.tsx`**

```tsx
type Props = {
  icon?: React.ReactNode;
  title: string;
  desc?: string;
  cta?: React.ReactNode;
  color?: "cyan" | "magenta" | "purple";
};

export function EmptyState({ icon = "∅", title, desc, cta, color = "purple" }: Props) {
  return (
    <div className={`cp-empty cp-empty--boxed cp-empty--${color}`} role="status">
      <div className="cp-empty__icon">{icon}</div>
      <h3 className="cp-empty__title">{title}</h3>
      {desc && <p className="cp-empty__desc">{desc}</p>}
      {cta && <div className="cp-empty__action">{cta}</div>}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/feedback/ErrorState.tsx`**

```tsx
"use client";

type Props = {
  code?: string;
  message?: string;
  retry?: () => void;
};

export function ErrorState({ code = "UNKNOWN", message = "An error occurred", retry }: Props) {
  return (
    <div className="cp-alert cp-alert--danger" role="alert">
      <div className="cp-alert__icon">!</div>
      <div className="cp-alert__content">
        <p className="cp-alert__title">[{code}]</p>
        <p className="cp-alert__body">{message}</p>
      </div>
      {retry && (
        <button className="cp-btn cp-btn--ghost cp-btn--sm" onClick={retry}>
          RETRY
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/feedback/Skeleton.tsx`**

```tsx
export function ItemCardSkeleton() {
  return (
    <div className="cp-card cp-card--cut" aria-hidden="true">
      <div className="cp-skeleton" style={{ height: 200, width: "100%" }} />
      <div className="cp-card__body">
        <div className="cp-skeleton" style={{ height: 18, width: "70%", marginBottom: 8 }} />
        <div className="cp-skeleton" style={{ height: 14, width: "40%" }} />
      </div>
    </div>
  );
}

export function ItemGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="cp-grid cp-grid--auto" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ItemCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Type-check + commit**

```bash
npx tsc --noEmit
git add components/feedback
git commit -m "feat: add TickerTape, EmptyState, ErrorState, Skeleton components"
```

---

## Task 12: Item display components

**Files:**
- Create: `components/item/RarityBadge.tsx`, `components/item/PriceTag.tsx`, `components/item/StockIndicator.tsx`, `components/item/ItemCard.tsx`, `components/item/ItemGrid.tsx`

- [ ] **Step 1: Create `components/item/RarityBadge.tsx`**

```tsx
import type { Rarity } from "@/lib/client/types";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "COMMON",
  rare: "▲ RARE",
  epic: "◇ EPIC",
  legendary: "★ LEGENDARY",
  mythic: "◆ MYTHIC",
  unique: "⬢ 1/1 UNIQUE",
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: "fg-muted",
  rare: "green",
  epic: "purple",
  legendary: "yellow",
  mythic: "cyan",
  unique: "magenta",
};

export function RarityBadge({ rarity, size = "sm" }: { rarity: Rarity; size?: "sm" | "md" }) {
  const color = RARITY_COLOR[rarity];
  const cls = `cp-badge cp-badge--${color} ${size === "md" ? "cp-badge--lg" : ""}`;
  return <span className={cls}>{RARITY_LABEL[rarity]}</span>;
}

export const rarityColor = (r: Rarity) => RARITY_COLOR[r];
```

- [ ] **Step 2: Create `components/item/PriceTag.tsx`**

```tsx
import { formatNeon } from "@/lib/format";

type Props = {
  value: number;
  variant?: "default" | "large";
  compact?: boolean;
};

export function PriceTag({ value, variant = "default", compact = true }: Props) {
  const cls =
    variant === "large"
      ? "font-cp-mono text-cp-yellow-500 text-2xl font-bold"
      : "font-cp-mono text-cp-yellow-500 text-sm font-semibold";
  return <span className={cls}>{formatNeon(value, { compact })}</span>;
}
```

- [ ] **Step 3: Create `components/item/StockIndicator.tsx`**

```tsx
type Props = { stock: number };

export function StockIndicator({ stock }: Props) {
  if (stock === 0) {
    return <span className="cp-badge cp-badge--red">SOLD OUT</span>;
  }
  if (stock === 1) {
    return <span className="cp-badge cp-badge--magenta">1/1 — LAST UNIT</span>;
  }
  if (stock <= 5) {
    return <span className="cp-badge cp-badge--yellow">LOW · {stock} LEFT</span>;
  }
  return <span className="cp-badge cp-badge--green">IN STOCK</span>;
}
```

- [ ] **Step 4: Create `components/item/ItemCard.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import type { Weapon } from "@/lib/client/types";
import { RarityBadge, rarityColor } from "./RarityBadge";
import { PriceTag } from "./PriceTag";
import { StockIndicator } from "./StockIndicator";

type Props = {
  weapon: Weapon;
};

export function ItemCard({ weapon }: Props) {
  const color = rarityColor(weapon.rarity);
  const isHigh = weapon.rarity === "mythic" || weapon.rarity === "unique";
  const cls = [
    "cp-card",
    "cp-card--cut",
    `cp-card--${color}`,
    isHigh ? "animate-cp-pulse" : "",
    "transition-transform",
    "hover:-translate-y-0.5",
  ].join(" ");

  return (
    <Link href={`/browse/${weapon.slug}`} className={cls}>
      <div className="relative" style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
        <Image
          src={weapon.imageUrl}
          alt={weapon.name}
          width={600}
          height={600}
          sizes="(max-width: 768px) 100vw, 25vw"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
        <div className="cp-scanlines" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
      </div>
      <div className="cp-card__body">
        <div className="flex items-center justify-between mb-2">
          <RarityBadge rarity={weapon.rarity} />
          <StockIndicator stock={weapon.stock} />
        </div>
        <h3 className="cp-card__title font-cp-display text-base">{weapon.name}</h3>
        <p className="text-cp-fg-muted text-xs mb-3">{weapon.seller}</p>
        <div className="flex items-center justify-between">
          <PriceTag value={weapon.priceNeon} />
          <span className="text-cp-fg-dim text-[10px] uppercase tracking-widest">
            {weapon.subCategory.replace("-", " ")}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Configure `next.config.ts` to allow picsum images**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 6: Create `components/item/ItemGrid.tsx`**

```tsx
import type { Weapon } from "@/lib/client/types";
import { ItemCard } from "./ItemCard";
import { EmptyState } from "@/components/feedback/EmptyState";

export function ItemGrid({ items }: { items: Weapon[] }) {
  if (items.length === 0) {
    return <EmptyState title="No transmissions" desc="No weapons match your filters." />;
  }
  return (
    <div className="cp-grid cp-grid--auto" style={{ ["--cp-grid-min" as string]: "260px" }}>
      {items.map((w) => (
        <ItemCard key={w.slug} weapon={w} />
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Type-check + commit**

```bash
npx tsc --noEmit
git add components/item next.config.ts
git commit -m "feat: add RarityBadge, PriceTag, StockIndicator, ItemCard, ItemGrid"
```

---

## Task 13: Filter components

**Files:**
- Create: `components/filters/SearchBox.tsx`, `components/filters/SubCategoryFilter.tsx`, `components/filters/RarityFilter.tsx`, `components/filters/PriceRangeSlider.tsx`, `components/filters/SortSegmented.tsx`, `components/filters/FilterSidebar.tsx`, `components/filters/Pagination.tsx`

- [ ] **Step 1: Create `components/filters/SearchBox.tsx`**

```tsx
"use client";
import { useEffect, useState } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  debounceMs?: number;
};

export function SearchBox({ value, onChange, debounceMs = 300 }: Props) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceMs]);

  return (
    <label className="cp-field">
      <span className="cp-field__label">SEARCH</span>
      <input
        className="cp-input cp-input--cut cp-input--cyan"
        type="search"
        placeholder="mjolnir, norse, ..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
    </label>
  );
}
```

- [ ] **Step 2: Create `components/filters/SubCategoryFilter.tsx`**

```tsx
"use client";
import type { SubCategory } from "@/lib/client/types";

const ALL: { key: SubCategory; label: string }[] = [
  { key: "melee", label: "Melee" },
  { key: "ranged", label: "Ranged" },
  { key: "energy-divine", label: "Energy / Divine" },
  { key: "cursed", label: "Cursed" },
  { key: "1of1", label: "1 of 1" },
];

type Props = {
  value: SubCategory[];
  onChange: (v: SubCategory[]) => void;
};

export function SubCategoryFilter({ value, onChange }: Props) {
  const toggle = (k: SubCategory) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <fieldset>
      <legend className="cp-field__label">CATEGORY</legend>
      <div className="cp-stack" style={{ ["--cp-stack-gap" as string]: "0.5rem" }}>
        {ALL.map((o) => (
          <label key={o.key} className="cp-checkbox">
            <input
              type="checkbox"
              className="cp-checkbox__input"
              checked={value.includes(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span className="cp-checkbox__mark" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 3: Create `components/filters/RarityFilter.tsx`**

```tsx
"use client";
import type { Rarity } from "@/lib/client/types";

const ALL: { key: Rarity; label: string; color: string }[] = [
  { key: "common", label: "Common", color: "fg-muted" },
  { key: "rare", label: "Rare", color: "green" },
  { key: "epic", label: "Epic", color: "purple" },
  { key: "legendary", label: "Legendary", color: "yellow" },
  { key: "mythic", label: "Mythic", color: "cyan" },
  { key: "unique", label: "1/1 Unique", color: "magenta" },
];

type Props = {
  value: Rarity[];
  onChange: (v: Rarity[]) => void;
};

export function RarityFilter({ value, onChange }: Props) {
  const toggle = (k: Rarity) =>
    onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <fieldset>
      <legend className="cp-field__label">RARITY</legend>
      <div className="cp-stack" style={{ ["--cp-stack-gap" as string]: "0.4rem" }}>
        {ALL.map((o) => (
          <label key={o.key} className="cp-checkbox">
            <input
              type="checkbox"
              className="cp-checkbox__input"
              checked={value.includes(o.key)}
              onChange={() => toggle(o.key)}
            />
            <span className="cp-checkbox__mark" />
            <span className={`cp-chip cp-chip--${o.color}`}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 4: Create `components/filters/PriceRangeSlider.tsx`**

```tsx
"use client";
import { formatNeon } from "@/lib/format";

type Props = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
};

export function PriceRangeSlider({ min, max, value, onChange }: Props) {
  const [lo, hi] = value;
  return (
    <div>
      <span className="cp-field__label">PRICE</span>
      <div className="text-xs text-cp-fg-muted mb-2">
        {formatNeon(lo, { compact: true })} — {formatNeon(hi, { compact: true })}
      </div>
      <input
        type="range"
        className="cp-slider cp-slider--cyan"
        min={min}
        max={max}
        value={lo}
        onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        aria-label="Min price"
      />
      <input
        type="range"
        className="cp-slider cp-slider--magenta"
        min={min}
        max={max}
        value={hi}
        onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        aria-label="Max price"
      />
    </div>
  );
}
```

- [ ] **Step 5: Create `components/filters/SortSegmented.tsx`**

```tsx
"use client";
import type { SortKey } from "@/lib/client/types";

const OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price-asc", label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
  { key: "rarity", label: "Rarity" },
];

export function SortSegmented({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="cp-segmented cp-segmented--cyan" role="group" aria-label="Sort order">
      {OPTIONS.map((o) => (
        <label key={o.key} className="cp-segmented__option" data-active={value === o.key ? "true" : "false"}>
          <input
            type="radio"
            name="sort"
            className="cp-segmented__input"
            checked={value === o.key}
            onChange={() => onChange(o.key)}
          />
          {o.label}
        </label>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Create `components/filters/Pagination.tsx`**

```tsx
"use client";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pageSize, total, onChange }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= lastPage; p++) {
    if (p === 1 || p === lastPage || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <nav className="cp-pagination" aria-label="Pagination">
      <button
        className="cp-pagination__item"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        ‹
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="cp-pagination__ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`cp-pagination__item ${p === page ? "cp-pagination__item--active" : ""}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ),
      )}
      <button
        className="cp-pagination__item"
        onClick={() => onChange(Math.min(lastPage, page + 1))}
        disabled={page === lastPage}
      >
        ›
      </button>
    </nav>
  );
}
```

- [ ] **Step 7: Create `components/filters/FilterSidebar.tsx`**

```tsx
"use client";
import type { ItemFilters } from "@/lib/client/types";
import { SearchBox } from "./SearchBox";
import { SubCategoryFilter } from "./SubCategoryFilter";
import { RarityFilter } from "./RarityFilter";
import { PriceRangeSlider } from "./PriceRangeSlider";
import { SortSegmented } from "./SortSegmented";

const PRICE_MIN = 0;
const PRICE_MAX = 1_500_000;

export const defaultFilters: ItemFilters = {
  subCategories: [],
  rarities: [],
  minPrice: PRICE_MIN,
  maxPrice: PRICE_MAX,
  q: "",
  sort: "newest",
  page: 1,
};

type Props = {
  value: ItemFilters;
  onChange: (next: ItemFilters) => void;
};

export function FilterSidebar({ value, onChange }: Props) {
  const set = <K extends keyof ItemFilters>(k: K, v: ItemFilters[K]) =>
    onChange({ ...value, [k]: v, page: k === "page" ? (v as number) : 1 });

  return (
    <aside
      className="cp-stack p-4 border border-cp-border bg-cp-bg-soft"
      style={{ ["--cp-stack-gap" as string]: "1.25rem", width: 280, position: "sticky", top: 80, alignSelf: "start" }}
      aria-label="Filters"
    >
      <SearchBox value={value.q} onChange={(q) => set("q", q)} />
      <SubCategoryFilter value={value.subCategories} onChange={(s) => set("subCategories", s)} />
      <RarityFilter value={value.rarities} onChange={(r) => set("rarities", r)} />
      <PriceRangeSlider
        min={PRICE_MIN}
        max={PRICE_MAX}
        value={[value.minPrice, value.maxPrice]}
        onChange={([lo, hi]) => onChange({ ...value, minPrice: lo, maxPrice: hi, page: 1 })}
      />
      <SortSegmented value={value.sort} onChange={(s) => set("sort", s)} />
      <button className="cp-btn cp-btn--ghost cp-btn--sm" onClick={() => onChange(defaultFilters)}>
        RESET
      </button>
    </aside>
  );
}
```

- [ ] **Step 8: Type-check + commit**

```bash
npx tsc --noEmit
git add components/filters
git commit -m "feat: add SearchBox, filter widgets, FilterSidebar, Pagination"
```

---

## Task 14: Layout — Header and Footer

**Files:**
- Create: `components/layout/Header.tsx`, `components/layout/Footer.tsx`

- [ ] **Step 1: Create `components/layout/Header.tsx`**

```tsx
import Link from "next/link";
import { formatNeon } from "@/lib/format";

const HARDCODED_BALANCE = 250_000;

export function Header() {
  return (
    <header
      className="sticky top-0 z-40 border-b border-cp-border bg-cp-bg/80 backdrop-blur"
    >
      <div className="cp-container flex items-center gap-6 py-3">
        <Link href="/browse" className="font-cp-display text-cp-cyan-500 text-lg tracking-widest">
          ⌬ NEONMARKET
        </Link>
        <nav className="flex gap-4 text-sm uppercase tracking-wider">
          <Link href="/browse" className="text-cp-fg hover:text-cp-cyan-500">Browse</Link>
          <Link href="/orders" className="text-cp-fg-muted hover:text-cp-cyan-500">Orders</Link>
          <Link href="/seller" className="text-cp-fg-muted hover:text-cp-cyan-500">Seller</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="cp-chip cp-chip--yellow font-cp-mono text-xs">
            {formatNeon(HARDCODED_BALANCE, { compact: true })}
          </span>
          <span className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--sm" aria-label="John Tran">
            <span className="cp-avatar__initials">JT</span>
          </span>
        </div>
      </div>
    </header>
  );
}
```

> Note: real wallet API + dynamic balance comes in Plan 3. The hardcoded constant is replaced then.

- [ ] **Step 2: Create `components/layout/Footer.tsx`**

```tsx
export function Footer() {
  return (
    <footer className="border-t border-cp-border mt-16 py-6">
      <div className="cp-container flex items-center justify-between text-xs text-cp-fg-muted">
        <span>© 2185 NeonMarket · Licensed by VOTEK</span>
        <span className="cp-status cp-status--online cp-status--pill">
          <span className="cp-status__dot" />
          <span className="cp-status__label">ONLINE</span>
        </span>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/layout
git commit -m "feat: add Header (with placeholder wallet) and Footer"
```

---

## Task 15: Wire root layout

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/error.tsx`, `app/page.tsx` (replace default)

- [ ] **Step 1: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { TickerTape } from "@/components/feedback/TickerTape";

export const metadata: Metadata = {
  title: "NeonMarket — Arsenal of Myths",
  description: "Cyberpunk × mythology marketplace, 2185.",
};

const TICKER_ITEMS = [
  "MJOLNIR.exe sold for ⟁ 4.2K",
  "ICE-7 detected sector 9",
  "VATICAN-VAULT-7 listed HOLY-GRAIL at ⟁ 1.5M",
  "NETWORK STABLE · 12 ms",
  "AETHER.pulse-rifle restocked × 10",
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-cp-theme="dark">
      <body className="cp-root cp-grid-bg cp-scanlines">
        <Header />
        <TickerTape items={TICKER_ITEMS} />
        <main className="cp-container py-8 min-h-[60vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx` with placeholder redirect**

```tsx
import { redirect } from "next/navigation";

export default function HomePlaceholder() {
  redirect("/browse");
}
```

> Real Home arrives in Plan 2.

- [ ] **Step 3: Create `app/error.tsx`**

```tsx
"use client";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="cp-container py-16">
      <ErrorState
        code={(error as { code?: string }).code ?? "FATAL"}
        message={error.message}
        retry={reset}
      />
    </div>
  );
}
```

- [ ] **Step 4: Type-check + commit**

```bash
npx tsc --noEmit
git add app/layout.tsx app/page.tsx app/error.tsx
git commit -m "feat: wire root layout with header, ticker, footer; redirect / to /browse"
```

---

## Task 16: Browse page

**Files:**
- Create: `app/browse/page.tsx`

- [ ] **Step 1: Create `app/browse/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useItems } from "@/lib/client/hooks/useItems";
import { defaultFilters, FilterSidebar } from "@/components/filters/FilterSidebar";
import { Pagination } from "@/components/filters/Pagination";
import { ItemGrid } from "@/components/item/ItemGrid";
import { ItemGridSkeleton } from "@/components/feedback/Skeleton";
import { ErrorState } from "@/components/feedback/ErrorState";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function BrowsePage() {
  const [filters, setFilters] = useState(defaultFilters);
  const { items, total, page, pageSize, isLoading, error, mutate } = useItems(filters);

  return (
    <div className="flex gap-6 items-start">
      <FilterSidebar value={filters} onChange={setFilters} />
      <section className="flex-1 cp-stack" style={{ ["--cp-stack-gap" as string]: "1.5rem" }}>
        <div className="flex items-center justify-between">
          <NeonHeading level="lg" rarity="cyan">// ARSENAL CATALOG</NeonHeading>
          <span className="text-cp-fg-muted text-sm font-cp-mono">
            {isLoading ? "scanning..." : `${total} weapons indexed`}
          </span>
        </div>
        {error ? (
          <ErrorState
            code={(error as { code?: string }).code}
            message={(error as Error).message}
            retry={() => mutate()}
          />
        ) : isLoading ? (
          <ItemGridSkeleton count={8} />
        ) : (
          <ItemGrid items={items} />
        )}
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(p) => setFilters({ ...filters, page: p })}
        />
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Smoke test**

```bash
npm run dev
```

Open http://localhost:3000 — should redirect to `/browse`. Verify:
- Header sticky with brand, nav, balance chip, JT avatar
- Ticker scrolling under header
- Filter sidebar on left with search, category checkboxes, rarity, price slider, sort, reset button
- Item grid with at least one row of weapon cards
- Hover over a card: lifts up
- Filter by sub-category "1of1": only 3 unique relics show
- Search "norse": multiple results
- Sort by "Price ↑": cheapest first
- Pagination appears (40 / 24 = 2 pages)

Stop dev server when verified.

- [ ] **Step 3: Commit**

```bash
git add app/browse/page.tsx
git commit -m "feat: implement /browse listing page with filters, sort, pagination"
```

---

## Task 17: Playwright smoke test

**Files:**
- Create: `playwright.config.ts`, `e2e/browse.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

- [ ] **Step 3: Add e2e script in `package.json` `"scripts"`**

```json
"e2e": "playwright test"
```

- [ ] **Step 4: Create `e2e/browse.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("browse page loads, filters, and paginates", async ({ page }) => {
  await page.goto("/browse");

  await expect(page.getByText("ARSENAL CATALOG")).toBeVisible();
  await expect(page.getByText(/40 weapons indexed/)).toBeVisible({ timeout: 10_000 });

  // Type in search; wait for debounce + API
  await page.getByPlaceholder("mjolnir, norse, ...").fill("mjolnir");
  await expect(page.getByText("MJOLNIR.exe")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/1 weapons indexed|1 weapon indexed/)).toBeVisible({ timeout: 5_000 });

  // Clear search
  await page.getByPlaceholder("mjolnir, norse, ...").fill("");

  // Filter by 1of1
  await page.getByLabel("1 of 1").check();
  await expect(page.getByText("HOLY-GRAIL")).toBeVisible({ timeout: 10_000 });

  // Reset filters
  await page.getByRole("button", { name: "RESET" }).click();
  await expect(page.getByText(/40 weapons indexed/)).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 5: Run e2e test**

```bash
npm run e2e
```

Expected: 1 passing test.

- [ ] **Step 6: Add `.gitignore` entries for Playwright artefacts**

Append to `.gitignore`:

```
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
```

- [ ] **Step 7: Commit**

```bash
git add e2e playwright.config.ts package.json package-lock.json .gitignore
git commit -m "test: add Playwright smoke test for /browse"
```

---

## Task 18: README + final manual checklist

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README**

```md
# NeonMarket — Cyber-Market

A cyberpunk × mythology marketplace UI demo. Year 2185. Mega-corps mine ancient relics and sell them as tech-weapons.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- `@rintran720/cyberpunk-ui` (CSS-only theme)
- SWR for client data fetching
- In-memory mock API via Next.js Route Handlers

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` — dev server (Turbopack)
- `npm run build` — production build
- `npm test` — Vitest unit tests
- `npm run e2e` — Playwright smoke test

## Plan 1 tour (current scope)

- `/browse` — 40 mythological weapons across 5 sub-categories, 6 rarity tiers
- Filter by category / rarity / price / search; sort newest / price / rarity; paginate 24 / page
- Header shows hardcoded "John Tran" + ⟁ 250K placeholder balance (real wallet in Plan 3)

## Coming in later plans

- Plan 2: Home page + Item Detail page (HUD/radar/gauge)
- Plan 3: Cart, checkout, wallet, orders, profile
- Plan 4: Seller dashboard + 4-step create flow
- Plan 5: Glow toggle, animation polish, a11y audit
```

- [ ] **Step 2: Run full test suite**

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: all green.

- [ ] **Step 3: Run final manual checklist**

With dev server running:

- [ ] Open `/` → redirects to `/browse`
- [ ] Header visible, ticker scrolling, footer at bottom
- [ ] 40 weapons indexed counter displays after load
- [ ] At least one mythic and one unique card has the subtle pulse animation
- [ ] Hover on card lifts it slightly
- [ ] Click on a card navigates to `/browse/<slug>` (404 page is fine — detail page comes in Plan 2)
- [ ] Sub-category filter narrows results
- [ ] Search "vatican" returns the 3 relic listings
- [ ] Sort by "Price ↑" puts STARTER.blade first
- [ ] Pagination shows 2 pages; clicking page 2 scrolls smoothly
- [ ] Reset returns to 40 weapons indexed
- [ ] Refresh on `/browse?...` → SWR re-fetches, skeleton appears briefly
- [ ] In DevTools: throttle network to "Slow 3G" → skeletons visible during navigation
- [ ] No console errors

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: README with setup, tour, and roadmap"
```

---

## Definition of Done — Plan 1

1. ✅ `npm install && npm run dev` boots without warnings
2. ✅ `/browse` lists 40 weapons with full filter / sort / search / pagination
3. ✅ Cyberpunk theme visibly applied (background grid, scanlines, neon accents, rarity colours)
4. ✅ All 24+ unit tests pass; Playwright smoke test passes
5. ✅ `npx tsc --noEmit` exits 0
6. ✅ `npm run build` exits 0 with no errors
7. ✅ Manual checklist (Task 18 step 3) all checked
8. ✅ Git history shows incremental commits per task
