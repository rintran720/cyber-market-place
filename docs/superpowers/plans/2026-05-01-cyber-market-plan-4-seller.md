# Cyber-Market — Plan 4: Seller (Dashboard + 4-step Create Flow)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the seller side of the marketplace: a dashboard at `/seller` showing John Tran's listings + sales stats + a tiny sales chart, plus a 4-step "List a Weapon" create flow at `/seller/new` that publishes a new weapon (with terminal mint animation) into the in-memory store so it shows up across the app.

**Architecture:** Two new mock-API endpoints (`/api/listings`, `/api/stats`) backed by an extension to `lib/api/store.ts`. Eight pre-seeded listings owned by `john-tran` give the dashboard meaningful data without needing the user to publish first. Two new SWR hooks (`useListings`, `useStats`) plus a `createListing` mutation that POSTs the new weapon, optimistically inserts it into the store, and returns its slug for the success screen. The dashboard renders 4 stat tiles + a hand-rolled SVG sales chart + a listings table. The create flow is a 4-step `<StepperShell>` (Category → Media + Tags → Price + Stats + Lore → Preview + Publish), with the publish step running a `CheckoutTerminal`-style typewriter ("> minting NFT...") and pushing to a "minting" loading state.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · `@rintran720/cyberpunk-ui` · SWR

**Spec reference:** `docs/superpowers/specs/2026-04-30-cyber-market-design.md` — sections 4 (listings + stats endpoints), 5, 6.7, 8.

**Out of scope (later plan):**
- Glow toggle, animation polish, a11y audit (Plan 5)

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/api/store.ts` (modify) | Add `listings` Map (slug → Listing extras: views, sales, revenue), `getListings`, `pushListing`, `getSellerStats` |
| `lib/api/seed/listings.json` | 8 listings owned by John Tran (slugs from existing weapon seed) with views/sales/revenue/last-30-day-sales numbers |
| `app/api/listings/route.ts` | GET own listings, POST create new |
| `app/api/stats/route.ts` | GET seller stats (totals + 30-day sales array) |
| `lib/client/hooks/useListings.ts` | SWR + createListing mutation |
| `lib/client/hooks/useStats.ts` | SWR wrapper |
| `components/seller/StatsBar.tsx` | 4 StatHUDs in a row (revenue, sales, active listings, top item) |
| `components/seller/SalesChart.tsx` | SVG line chart for 30-day sales |
| `components/seller/ListingRow.tsx` | One row in dashboard table |
| `components/seller/StepperShell.tsx` | 4-step navigation shell (used by `/seller/new`) |
| `components/seller/Step1Category.tsx` | 5 large clickable sub-category cards |
| `components/seller/Step2Media.tsx` | Dropzone + name + tags chips input |
| `components/seller/Step3PriceStats.tsx` | Rarity radio + price input + 4 stat sliders + lore textarea |
| `components/seller/Step4Preview.tsx` | Live preview of new ItemCard + PUBLISH button + terminal modal |
| `app/seller/page.tsx` | Dashboard |
| `app/seller/new/page.tsx` | 4-step create flow (client) |
| `tests/listings-api.test.ts` | Vitest |
| `tests/stats-api.test.ts` | Vitest |
| `e2e/seller.spec.ts` | Playwright: dashboard renders, click "+ LIST NEW WEAPON", complete 4 steps, publish, new listing appears, browse it on `/browse` |

---

## Task 1: Extend store + seed listings

**Files:**
- Modify: `lib/api/store.ts`
- Create: `lib/api/seed/listings.json`

- [ ] **Step 1: Create `lib/api/seed/listings.json`**

```json
[
  { "slug": "mjolnir-exe",      "views": 1842, "sales": 7,  "revenue": 29400 },
  { "slug": "excalibur-dll",    "views": 1320, "sales": 3,  "revenue": 18600 },
  { "slug": "kusanagi-blade",   "views": 982,  "sales": 5,  "revenue": 24000 },
  { "slug": "valkyrie-rifle",   "views": 654,  "sales": 4,  "revenue": 21600 },
  { "slug": "shadow-katar",     "views": 1205, "sales": 16, "revenue": 13600 },
  { "slug": "claws-of-anubis",  "views": 488,  "sales": 4,  "revenue": 8400  },
  { "slug": "phoenix-quiver",   "views": 372,  "sales": 6,  "revenue": 5880  },
  { "slug": "starter-blade",    "views": 95,   "sales": 12, "revenue": 600   }
]
```

- [ ] **Step 2: Extend `lib/api/store.ts`**

Add the following to the bottom of `lib/api/store.ts`:

```ts
import seedListings from "./seed/listings.json";
import type { Listing, SellerStats, Weapon } from "@/lib/client/types";

type ListingExtras = { views: number; sales: number; revenue: number };
const listingExtras = new Map<string, ListingExtras>();
for (const r of seedListings as ListingExtras[] & { slug: string }[]) {
  listingExtras.set(r.slug, { views: r.views, sales: r.sales, revenue: r.revenue });
}

export const getListings = (): Listing[] => {
  const out: Listing[] = [];
  for (const [slug, ext] of listingExtras.entries()) {
    const w = getWeaponBySlug(slug);
    if (!w) continue;
    out.push({ ...w, ...ext });
  }
  return out.sort((a, b) => b.revenue - a.revenue);
};

export const pushListing = (weapon: Weapon): Listing => {
  // append to weapons store
  store.weapons = [...store.weapons, weapon];
  listingExtras.set(weapon.slug, { views: 0, sales: 0, revenue: 0 });
  return { ...weapon, views: 0, sales: 0, revenue: 0 };
};

const SECONDS_PER_DAY = 24 * 60 * 60;

export const getSellerStats = (): SellerStats & { sales30d: number[] } => {
  let totalRevenue = 0;
  let totalSales = 0;
  let topItem = "—";
  let topRevenue = 0;
  for (const [slug, ext] of listingExtras.entries()) {
    totalRevenue += ext.revenue;
    totalSales += ext.sales;
    if (ext.revenue > topRevenue) {
      topRevenue = ext.revenue;
      topItem = slug;
    }
  }
  // Deterministic-ish 30-day sales array from totals
  const sales30d: number[] = [];
  let seed = totalSales * 31;
  for (let i = 0; i < 30; i++) {
    seed = (seed * 1103515245 + 12345) % 2 ** 31;
    const base = totalSales / 30;
    const jitter = ((seed >>> 8) % 100) / 100 - 0.5; // -0.5..0.5
    sales30d.push(Math.max(0, Math.round(base + jitter * base * 1.5)));
  }
  return {
    totalRevenue,
    totalSales,
    activeListings: listingExtras.size,
    topItem,
    sales30d,
  };
};
```

> **Note:** the `store` module-level variable holds `weapons` as `Weapon[]`; if your existing implementation uses `const store: Store = ...` with `weapons: Weapon[]`, change it to `let store: Store = ...` so `pushListing` can replace the array. Or mutate `store.weapons.push(weapon)` instead of reassignment — pick whichever matches the codebase.

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add lib/api/store.ts lib/api/seed/listings.json
git commit -m "feat: extend store with listings extras, seller stats, sales30d"
```

---

## Task 2: Listings + Stats API (TDD)

**Files:**
- Create: `app/api/listings/route.ts`, `app/api/stats/route.ts`, `tests/listings-api.test.ts`, `tests/stats-api.test.ts`

- [ ] **Step 1: Tests**

```ts
// tests/listings-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET, POST } from "@/app/api/listings/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

describe("Listings API", () => {
  it("GET returns 8 seeded listings (or more after POSTs)", async () => {
    const res = await GET();
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(8);
    expect(body[0]).toHaveProperty("views");
    expect(body[0]).toHaveProperty("sales");
    expect(body[0]).toHaveProperty("revenue");
  });

  it("POST validates required fields", async () => {
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ name: "FOO.bar" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("POST creates a listing visible in subsequent GET", async () => {
    const draft = {
      name: "TEST.weapon",
      subCategory: "melee",
      rarity: "rare",
      priceNeon: 999,
      seller: "john-tran",
      origin: "Test",
      imageUrl: "/items/starter-blade.svg",
      stats: { damage: 30, speed: 30, range: 5, soulCost: 5 },
      lore: "Auto-test relic.",
      stock: 1,
      tags: ["test"],
    };
    const created = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify(draft),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(created.status).toBe(200);
    const createdBody = await created.json();
    expect(createdBody.slug).toBeTruthy();
    expect(createdBody.views).toBe(0);

    const list = await (await GET()).json();
    expect(list.find((l: { slug: string }) => l.slug === createdBody.slug)).toBeTruthy();
  });
});
```

```ts
// tests/stats-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/stats/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

describe("Stats API", () => {
  it("GET returns totals + 30-day sales array", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(typeof body.totalRevenue).toBe("number");
    expect(typeof body.totalSales).toBe("number");
    expect(typeof body.activeListings).toBe("number");
    expect(typeof body.topItem).toBe("string");
    expect(Array.isArray(body.sales30d)).toBe(true);
    expect(body.sales30d).toHaveLength(30);
  });
});
```

- [ ] **Step 2: Implementations**

```ts
// app/api/listings/route.ts
import { NextResponse } from "next/server";
import { getListings, pushListing, getWeaponBySlug } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";
import type { Rarity, SubCategory, Weapon } from "@/lib/client/types";

const VALID_SUB: SubCategory[] = ["melee", "ranged", "energy-divine", "cursed", "1of1"];
const VALID_RARITY: Rarity[] = ["common", "rare", "epic", "legendary", "unique"];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `listing-${Date.now()}`
  );
}

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getListings());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(800, 1500);
    maybeError(0.04);
    const draft = (await req.json()) as Partial<Weapon>;
    const required: (keyof Weapon)[] = [
      "name",
      "subCategory",
      "rarity",
      "priceNeon",
      "seller",
      "origin",
      "imageUrl",
      "stats",
      "lore",
      "stock",
      "tags",
    ];
    for (const k of required) {
      if (draft[k] === undefined || draft[k] === null) {
        throw new ApiError(400, "MISSING_FIELD", `Missing field: ${String(k)}`);
      }
    }
    if (!VALID_SUB.includes(draft.subCategory as SubCategory)) {
      throw new ApiError(400, "BAD_SUBCATEGORY", `Invalid subCategory: ${draft.subCategory}`);
    }
    if (!VALID_RARITY.includes(draft.rarity as Rarity)) {
      throw new ApiError(400, "BAD_RARITY", `Invalid rarity: ${draft.rarity}`);
    }
    if (draft.subCategory === "1of1" && (draft.rarity !== "unique" || draft.stock !== 1)) {
      throw new ApiError(
        400,
        "INVARIANT",
        "Sub-category 1of1 requires rarity=unique and stock=1.",
      );
    }
    let slug = slugify(draft.name as string);
    while (getWeaponBySlug(slug)) slug = slug + "-" + Math.random().toString(36).slice(2, 6);
    const weapon: Weapon = {
      slug,
      name: draft.name as string,
      subCategory: draft.subCategory as SubCategory,
      rarity: draft.rarity as Rarity,
      priceNeon: Math.max(1, Math.floor(draft.priceNeon as number)),
      seller: draft.seller as string,
      origin: draft.origin as string,
      imageUrl: draft.imageUrl as string,
      stats: draft.stats as Weapon["stats"],
      lore: draft.lore as string,
      stock: Math.max(1, Math.floor(draft.stock as number)),
      tags: (draft.tags as string[]) ?? [],
      createdAt: new Date().toISOString(),
    };
    const listing = pushListing(weapon);
    return NextResponse.json(listing);
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

```ts
// app/api/stats/route.ts
import { NextResponse } from "next/server";
import { getSellerStats } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getSellerStats());
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- tests/listings-api.test.ts tests/stats-api.test.ts
git add app/api/listings app/api/stats tests/listings-api.test.ts tests/stats-api.test.ts
git commit -m "feat: listings + stats API with validation + 30-day sales array"
```

---

## Task 3: Hooks (useListings + useStats)

**Files:**
- Create: `lib/client/hooks/useListings.ts`, `lib/client/hooks/useStats.ts`

- [ ] **Step 1: `useListings`**

```ts
"use client";

import useSWR from "swr";
import { fetcher, ClientApiError } from "@/lib/client/fetcher";
import type { Listing, Weapon } from "@/lib/client/types";

export function useListings() {
  const { data, error, isLoading, mutate } = useSWR<Listing[]>("/api/listings", fetcher, {
    revalidateOnFocus: false,
  });

  const createListing = async (draft: Omit<Weapon, "slug" | "createdAt">): Promise<Listing> => {
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ClientApiError(res.status, body?.error?.code ?? "UNKNOWN", body?.error?.message);
    }
    const created = (await res.json()) as Listing;
    await mutate();
    return created;
  };

  return { listings: data ?? [], isLoading, error, mutate, createListing };
}
```

- [ ] **Step 2: `useStats`**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { SellerStats } from "@/lib/client/types";

type SellerStatsExt = SellerStats & { sales30d: number[] };

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<SellerStatsExt>("/api/stats", fetcher, {
    revalidateOnFocus: false,
  });
  return { stats: data, isLoading, error, mutate };
}
```

- [ ] **Step 3: Commit**

```bash
npx tsc --noEmit
git add lib/client/hooks/useListings.ts lib/client/hooks/useStats.ts
git commit -m "feat: useListings (with createListing) + useStats hooks"
```

---

## Task 4: StatsBar component

**Files:**
- Create: `components/seller/StatsBar.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import type { SellerStats } from "@/lib/client/types";
import { StatHUD } from "@/components/item/StatHUD";
import { formatNeon } from "@/lib/format";

export function StatsBar({ stats }: { stats?: SellerStats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cp-skeleton" style={{ height: 92 }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatHUD label="REVENUE" value={Math.round(stats.totalRevenue / 1000)} max={Math.max(stats.totalRevenue / 1000, 100)} hue="yellow" />
      <StatHUD label="SALES" value={stats.totalSales} max={Math.max(100, stats.totalSales)} hue="green" />
      <StatHUD label="ACTIVE LISTINGS" value={stats.activeListings} max={Math.max(20, stats.activeListings)} hue="cyan" />
      {/* Top item is text — render separately */}
      <div className="border border-cp-border p-3 bg-cp-bg-soft">
        <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted">TOP ITEM</div>
        <div className="font-cp-display text-base text-cp-magenta-500 mt-2 truncate">{stats.topItem}</div>
        <div className="font-cp-mono text-[10px] text-cp-fg-muted mt-1">REVENUE LEADER</div>
      </div>
    </div>
  );
}
```

> Note: `StatHUD` displays the raw `value` — the REVENUE tile shows revenue / 1000 to keep digit count sane. If you'd rather show the full revenue, replace `StatHUD` for that tile with a copy of the same layout that calls `formatNeon(stats.totalRevenue, { compact: true })` in the value slot.

- [ ] **Step 2: Commit**

```bash
npx tsc --noEmit
git add components/seller/StatsBar.tsx
git commit -m "feat: StatsBar (4 tiles for revenue/sales/listings/top-item)"
```

---

## Task 5: SalesChart SVG

**Files:**
- Create: `components/seller/SalesChart.tsx`

- [ ] **Step 1: Implementation**

```tsx
"use client";

type Props = {
  data: number[];
  height?: number;
};

export function SalesChart({ data, height = 140 }: Props) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const stepX = 100 / (data.length - 1 || 1);
  const points = data
    .map((v, i) => `${(i * stepX).toFixed(2)},${(100 - (v / max) * 90).toFixed(2)}`)
    .join(" ");

  return (
    <div className="border border-cp-border bg-cp-bg-soft p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500">// SALES</div>
          <div className="font-cp-display text-lg">Last 30 days</div>
        </div>
        <div className="font-cp-mono text-cp-fg-muted text-xs">peak {max}/day</div>
      </div>
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label="30-day sales trend"
      >
        {/* horizontal grid */}
        {[20, 40, 60, 80].map((y) => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
        ))}
        {/* tick marks at base */}
        {data.map((_, i) => (
          <line
            key={i}
            x1={(i * stepX).toFixed(2)}
            y1="100"
            x2={(i * stepX).toFixed(2)}
            y2="98"
            stroke="rgba(0,240,255,0.45)"
            strokeWidth="0.5"
          />
        ))}
        {/* fill under curve */}
        <polyline
          points={`0,100 ${points} 100,100`}
          fill="rgba(0,240,255,0.12)"
          stroke="none"
        />
        {/* main line */}
        <polyline
          points={points}
          fill="none"
          stroke="#00f0ff"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 4px #00f0ff)" }}
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/SalesChart.tsx
git commit -m "feat: SalesChart hand-rolled SVG line chart"
```

---

## Task 6: ListingRow + Seller Dashboard

**Files:**
- Create: `components/seller/ListingRow.tsx`, `app/seller/page.tsx`

- [ ] **Step 1: `ListingRow.tsx`**

```tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";
import { RarityBadge } from "@/components/item/RarityBadge";

export function ListingRow({ listing }: { listing: Listing }) {
  return (
    <tr className="border-b border-cp-border hover:bg-cp-bg-soft/50">
      <td className="py-2 pr-2">
        <div className="flex items-center gap-3">
          <Link href={`/browse/${listing.slug}`} className="block w-12 h-12 relative overflow-hidden border border-cp-border">
            <Image src={listing.imageUrl} alt={listing.name} fill sizes="48px" style={{ objectFit: "cover" }} />
          </Link>
          <div>
            <Link href={`/browse/${listing.slug}`} className="font-cp-display hover:text-cp-cyan-500">{listing.name}</Link>
            <div className="text-cp-fg-muted text-[11px]">{listing.subCategory.replace("-"," ")}</div>
          </div>
        </div>
      </td>
      <td className="py-2 px-2"><RarityBadge rarity={listing.rarity} /></td>
      <td className="py-2 px-2 font-cp-mono text-cp-yellow-500">{formatNeon(listing.priceNeon, { compact: true })}</td>
      <td className="py-2 px-2 font-cp-mono">{listing.views.toLocaleString()}</td>
      <td className="py-2 px-2 font-cp-mono">{listing.sales}</td>
      <td className="py-2 px-2 font-cp-mono text-cp-yellow-500">{formatNeon(listing.revenue, { compact: true })}</td>
      <td className="py-2 px-2">
        {listing.stock > 0 ? (
          <span className="cp-badge cp-badge--green">ACTIVE</span>
        ) : (
          <span className="cp-badge cp-badge--red">SOLD OUT</span>
        )}
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: `app/seller/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useListings } from "@/lib/client/hooks/useListings";
import { useStats } from "@/lib/client/hooks/useStats";
import { StatsBar } from "@/components/seller/StatsBar";
import { SalesChart } from "@/components/seller/SalesChart";
import { ListingRow } from "@/components/seller/ListingRow";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function SellerDashboard() {
  const { stats, isLoading: statsLoading } = useStats();
  const { listings, isLoading: listLoading } = useListings();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-end justify-between">
        <div>
          <NeonHeading level="lg" rarity="cyan">{"// SELLER DASHBOARD"}</NeonHeading>
          <p className="text-cp-fg-muted text-sm mt-1">@ john-tran</p>
        </div>
        <Link
          href="/seller/new"
          className="inline-flex items-center gap-2 px-5 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-magenta"
          style={{
            background: "var(--cp-magenta-500, #ff00ea)",
            color: "#04050b",
            clipPath:
              "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          + LIST NEW WEAPON
        </Link>
      </header>

      <StatsBar stats={statsLoading ? undefined : stats ?? undefined} />

      {stats && <SalesChart data={stats.sales30d} />}

      <section>
        <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-2">// LISTINGS</div>
        <h3 className="font-cp-display text-xl mb-4">Active inventory</h3>
        {listLoading ? (
          <p className="text-cp-fg-muted">scanning catalogue...</p>
        ) : (
          <table className="cp-table cp-table--bordered cp-table--hover w-full text-sm">
            <thead>
              <tr className="text-left text-cp-fg-muted text-[10px] tracking-[0.3em] font-cp-mono">
                <th className="py-2 pr-2">ITEM</th>
                <th className="py-2 px-2">RARITY</th>
                <th className="py-2 px-2">PRICE</th>
                <th className="py-2 px-2">VIEWS</th>
                <th className="py-2 px-2">SALES</th>
                <th className="py-2 px-2">REVENUE</th>
                <th className="py-2 px-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => <ListingRow key={l.slug} listing={l} />)}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Smoke + commit**

```bash
git add components/seller/ListingRow.tsx app/seller/page.tsx
git commit -m "feat: /seller dashboard with stats bar + sales chart + listings table"
```

---

## Task 7: StepperShell

**Files:**
- Create: `components/seller/StepperShell.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import type { ReactNode } from "react";

type Props = {
  steps: string[];
  current: number;
  children: ReactNode;
};

export function StepperShell({ steps, current, children }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <ol className="flex flex-wrap items-center gap-3 text-xs font-cp-mono">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${
              i === current ? "text-cp-cyan-500" : i < current ? "text-cp-green-500" : "text-cp-fg-muted"
            }`}
          >
            <span
              className={`w-7 h-7 grid place-items-center border ${
                i < current
                  ? "border-cp-green-500"
                  : i === current
                    ? "border-cp-cyan-500"
                    : "border-cp-border"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span className="uppercase tracking-widest">{s}</span>
            {i < steps.length - 1 && <span className="w-8 h-px bg-cp-border" />}
          </li>
        ))}
      </ol>
      <div>{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/StepperShell.tsx
git commit -m "feat: StepperShell wrapper for multi-step flows"
```

---

## Task 8: Step1Category

**Files:**
- Create: `components/seller/Step1Category.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import type { SubCategory } from "@/lib/client/types";

const OPTIONS: { key: SubCategory; label: string; desc: string }[] = [
  { key: "melee", label: "Melee", desc: "Swords, blades, daggers" },
  { key: "ranged", label: "Ranged", desc: "Bows, rifles, throwing" },
  { key: "energy-divine", label: "Energy / Divine", desc: "Mythic-class weaponry" },
  { key: "cursed", label: "Cursed", desc: "Soul-cost gear" },
  { key: "1of1", label: "1 of 1", desc: "Sealed unique relic" },
];

type Props = {
  value?: SubCategory;
  onChange: (v: SubCategory) => void;
  onNext: () => void;
};

export function Step1Category({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Pick a category</h2>
      <p className="text-cp-fg-muted text-sm mt-1">This determines the listing's filter bucket and chip color.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
        {OPTIONS.map((o) => {
          const active = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(o.key)}
              className={`text-left p-4 border transition ${
                active
                  ? "border-cp-cyan-500 shadow-cp-glow-cyan bg-cp-cyan-500/5"
                  : "border-cp-border hover:border-cp-cyan-500/50"
              }`}
            >
              <div className="font-cp-display text-lg">{o.label}</div>
              <div className="text-cp-fg-muted text-xs mt-1">{o.desc}</div>
            </button>
          );
        })}
      </div>
      <div className="mt-6 text-right">
        <button onClick={onNext} disabled={!value} className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40">
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/Step1Category.tsx
git commit -m "feat: Step1Category — sub-category selector cards"
```

---

## Task 9: Step2Media (name + image + tags)

**Files:**
- Create: `components/seller/Step2Media.tsx`

The dropzone here doesn't actually upload — it accepts a chosen file and shows a preview, but the persisted `imageUrl` falls back to `/items/starter-blade.svg` if no SVG path is given. Users with their own URL can paste it directly.

- [ ] **Step 1: Create**

```tsx
"use client";

import { useState } from "react";

type Draft = {
  name: string;
  imageUrl: string;
  tags: string[];
};

type Props = {
  value: Draft;
  onChange: (next: Draft) => void;
  onNext: () => void;
  onBack: () => void;
};

const PRESET_IMAGES = [
  "/items/starter-blade.svg",
  "/items/lotus-cestus.svg",
  "/items/sandalwood-sling.svg",
  "/items/feather-of-maat.svg",
  "/items/scarab-shuriken.svg",
];

export function Step2Media({ value, onChange, onNext, onBack }: Props) {
  const [tagDraft, setTagDraft] = useState("");

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || value.tags.includes(t)) return;
    onChange({ ...value, tags: [...value.tags, t] });
    setTagDraft("");
  };

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Name &amp; media</h2>

      <label className="cp-field mt-6 block">
        <span className="cp-field__label">// WEAPON NAME</span>
        <input
          className="cp-input cp-input--cut cp-input--cyan"
          type="text"
          maxLength={40}
          placeholder="MJOLNIR.exe"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </label>

      <div className="mt-6">
        <span className="cp-field__label">// IMAGE</span>
        <div className="flex flex-wrap gap-3 mt-2">
          {PRESET_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onChange({ ...value, imageUrl: src })}
              className={`w-20 h-20 border ${
                value.imageUrl === src ? "border-cp-cyan-500 shadow-cp-glow-cyan" : "border-cp-border"
              }`}
              aria-label={`Use ${src}`}
              style={{ backgroundImage: `url(${src})`, backgroundSize: "cover", backgroundPosition: "center" }}
            />
          ))}
        </div>
        <input
          type="text"
          className="cp-input cp-input--cut mt-3"
          placeholder="Or paste image URL/path..."
          value={value.imageUrl}
          onChange={(e) => onChange({ ...value, imageUrl: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <span className="cp-field__label">// TAGS</span>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            className="cp-input cp-input--cut flex-1"
            placeholder="lightning, hammer, norse..."
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
          />
          <button onClick={addTag} className="cp-btn cp-btn--ghost cp-btn--sm">+ ADD</button>
        </div>
        {value.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {value.tags.map((t) => (
              <span key={t} className="cp-chip cp-chip--cyan flex items-center gap-1">
                {t}
                <button onClick={() => onChange({ ...value, tags: value.tags.filter((x) => x !== t) })} aria-label={`Remove tag ${t}`}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="cp-btn cp-btn--ghost">‹ BACK</button>
        <button
          onClick={onNext}
          disabled={!value.name || !value.imageUrl}
          className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40"
        >
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/Step2Media.tsx
git commit -m "feat: Step2Media — name input, preset image picker, tags input"
```

---

## Task 10: Step3PriceStats

**Files:**
- Create: `components/seller/Step3PriceStats.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import type { Rarity, WeaponStats } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";

type Draft = {
  rarity: Rarity;
  priceNeon: number;
  origin: string;
  stock: number;
  stats: WeaponStats;
  lore: string;
};

const RARITY_OPTIONS: { key: Rarity; label: string; color: string }[] = [
  { key: "common", label: "Common", color: "fg-muted" },
  { key: "rare", label: "Rare", color: "green" },
  { key: "epic", label: "Epic", color: "purple" },
  { key: "legendary", label: "Legendary", color: "yellow" },
  { key: "unique", label: "1/1 Unique", color: "magenta" },
];

type Props = {
  value: Draft;
  onChange: (next: Draft) => void;
  onNext: () => void;
  onBack: () => void;
  is1of1: boolean;
};

export function Step3PriceStats({ value, onChange, onNext, onBack, is1of1 }: Props) {
  const setStat = (k: keyof WeaponStats, n: number) =>
    onChange({ ...value, stats: { ...value.stats, [k]: n } });

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Price, stats &amp; lore</h2>

      <fieldset className="mt-6">
        <legend className="cp-field__label">// RARITY</legend>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
          {RARITY_OPTIONS.map((o) => {
            const active = value.rarity === o.key;
            const disabled = is1of1 && o.key !== "unique";
            return (
              <button
                key={o.key}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...value, rarity: o.key, stock: o.key === "unique" ? 1 : value.stock })}
                className={`p-2 border text-xs font-cp-mono tracking-widest transition ${
                  active ? `border-cp-${o.color}-500 shadow-cp-glow-${o.color}` : "border-cp-border"
                } ${disabled ? "opacity-30 cursor-not-allowed" : "hover:border-cp-fg-muted"}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        {is1of1 && (
          <p className="text-cp-fg-muted text-xs mt-2">1-of-1 sub-category locks rarity to <strong>UNIQUE</strong> and stock to <strong>1</strong>.</p>
        )}
      </fieldset>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <label className="cp-field">
          <span className="cp-field__label">// PRICE (NEON)</span>
          <input
            className="cp-input cp-input--cut cp-input--yellow"
            type="number"
            min={1}
            max={5_000_000}
            value={value.priceNeon}
            onChange={(e) => onChange({ ...value, priceNeon: parseInt(e.target.value, 10) || 0 })}
          />
          <span className="cp-field__hint">{formatNeon(value.priceNeon, { compact: true })}</span>
        </label>
        <label className="cp-field">
          <span className="cp-field__label">// ORIGIN</span>
          <input
            className="cp-input cp-input--cut"
            type="text"
            value={value.origin}
            placeholder="Norse / Greek / Cyberpunk-original..."
            onChange={(e) => onChange({ ...value, origin: e.target.value })}
          />
        </label>
        <label className="cp-field">
          <span className="cp-field__label">// STOCK</span>
          <input
            className="cp-input cp-input--cut"
            type="number"
            min={1}
            disabled={is1of1}
            value={value.stock}
            onChange={(e) => onChange({ ...value, stock: parseInt(e.target.value, 10) || 1 })}
          />
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["damage", "speed", "range", "soulCost"] as const).map((k) => (
          <label key={k} className="block">
            <span className="cp-field__label uppercase">{k}</span>
            <input
              type="range"
              min={0}
              max={100}
              className="cp-slider cp-slider--cyan w-full"
              value={value.stats[k]}
              onChange={(e) => setStat(k, parseInt(e.target.value, 10))}
            />
            <div className="font-cp-mono text-cp-cyan-500 mt-1 text-sm">{value.stats[k]}</div>
          </label>
        ))}
      </div>

      <label className="cp-field mt-6 block">
        <span className="cp-field__label">// LORE</span>
        <textarea
          className="cp-input cp-textarea cp-input--cut"
          rows={4}
          maxLength={500}
          value={value.lore}
          onChange={(e) => onChange({ ...value, lore: e.target.value })}
          placeholder="One-paragraph backstory. The chain demands flavor."
        />
      </label>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="cp-btn cp-btn--ghost">‹ BACK</button>
        <button
          onClick={onNext}
          disabled={!value.priceNeon || !value.origin || !value.lore}
          className="cp-btn cp-btn--neon cp-btn--cyan disabled:opacity-40"
        >
          CONTINUE ›
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/Step3PriceStats.tsx
git commit -m "feat: Step3PriceStats — rarity radio, price/origin/stock inputs, stat sliders, lore textarea"
```

---

## Task 11: Step4Preview + publish

**Files:**
- Create: `components/seller/Step4Preview.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import { useState } from "react";
import type { Weapon } from "@/lib/client/types";
import { ItemCard } from "@/components/item/ItemCard";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";

type Props = {
  draft: Omit<Weapon, "slug" | "createdAt">;
  isPublishing: boolean;
  publishedSlug: string | null;
  onBack: () => void;
  onPublish: () => Promise<void>;
};

export function Step4Preview({ draft, isPublishing, publishedSlug, onBack, onPublish }: Props) {
  const [showTerminal, setShowTerminal] = useState(false);

  // We need a Weapon-shaped object for ItemCard preview. Add a placeholder slug.
  const previewWeapon: Weapon = {
    ...draft,
    slug: publishedSlug ?? "preview",
    createdAt: new Date().toISOString(),
  };

  const onClick = () => {
    setShowTerminal(true);
    void onPublish();
  };

  return (
    <div>
      <h2 className="cp-heading cp-heading--md">Preview &amp; publish</h2>
      <p className="text-cp-fg-muted text-sm mt-1">Final look before broadcasting.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <div>
          <ItemCard weapon={previewWeapon} />
        </div>
        <div className="border border-cp-border bg-cp-bg-soft p-4 text-sm">
          <p><span className="text-cp-fg-muted">Category:</span> {draft.subCategory}</p>
          <p><span className="text-cp-fg-muted">Rarity:</span> {draft.rarity}</p>
          <p><span className="text-cp-fg-muted">Price:</span> ⟁ {draft.priceNeon.toLocaleString()}</p>
          <p><span className="text-cp-fg-muted">Stock:</span> {draft.stock}</p>
          <p><span className="text-cp-fg-muted">Tags:</span> {draft.tags.join(", ") || "none"}</p>
          <hr className="cp-divider my-3" />
          <p className="text-cp-fg-muted">Lore</p>
          <p className="mt-1">{draft.lore}</p>
        </div>
      </div>

      {showTerminal && (
        <div className="mt-6">
          <CheckoutTerminal
            lines={[
              "> compiling item-spec",
              "> generating slug",
              "> minting NFT v2185",
              "> registering with chain-relay",
              "> publishing to marketplace",
            ]}
            finalTxHash={publishedSlug ? `0x${publishedSlug.padEnd(32, "0")}` : undefined}
          />
        </div>
      )}

      {publishedSlug && !isPublishing && (
        <div className="mt-6 border border-cp-green-500/40 p-4 shadow-cp-glow-green">
          <p className="font-cp-display text-cp-green-500 text-lg">✓ LISTING PUBLISHED</p>
          <p className="text-cp-fg-muted text-sm mt-1">slug: <span className="font-cp-mono">{publishedSlug}</span></p>
          <div className="mt-3 flex gap-3">
            <a href={`/browse/${publishedSlug}`} className="cp-btn cp-btn--neon cp-btn--cyan">VIEW LISTING ›</a>
            <a href="/seller" className="cp-btn cp-btn--ghost">BACK TO DASHBOARD</a>
          </div>
        </div>
      )}

      {!publishedSlug && (
        <div className="mt-6 flex justify-between">
          <button onClick={onBack} disabled={isPublishing} className="cp-btn cp-btn--ghost">‹ BACK</button>
          <button onClick={onClick} disabled={isPublishing} className="cp-btn cp-btn--neon cp-btn--magenta">
            {isPublishing ? "MINTING..." : "⟁ PUBLISH"}
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/seller/Step4Preview.tsx
git commit -m "feat: Step4Preview with terminal mint animation + success panel"
```

---

## Task 12: /seller/new orchestrator page

**Files:**
- Create: `app/seller/new/page.tsx`

- [ ] **Step 1: Implementation**

```tsx
"use client";

import { useState } from "react";
import { useListings } from "@/lib/client/hooks/useListings";
import { StepperShell } from "@/components/seller/StepperShell";
import { Step1Category } from "@/components/seller/Step1Category";
import { Step2Media } from "@/components/seller/Step2Media";
import { Step3PriceStats } from "@/components/seller/Step3PriceStats";
import { Step4Preview } from "@/components/seller/Step4Preview";
import type { Rarity, SubCategory, Weapon } from "@/lib/client/types";

const STEPS = ["Category", "Media", "Price & Stats", "Publish"];

const empty: Omit<Weapon, "slug" | "createdAt"> = {
  name: "",
  subCategory: "melee",
  rarity: "common",
  priceNeon: 100,
  seller: "john-tran",
  origin: "",
  imageUrl: "/items/starter-blade.svg",
  stats: { damage: 30, speed: 50, range: 10, soulCost: 5 },
  lore: "",
  stock: 1,
  tags: [],
};

export default function NewListingPage() {
  const { createListing } = useListings();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(empty);
  const [isPublishing, setPublishing] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const onPublish = async () => {
    setPublishing(true);
    try {
      const created = await createListing(draft);
      setPublishedSlug(created.slug);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <StepperShell steps={STEPS} current={publishedSlug ? STEPS.length - 1 : step}>
        {step === 0 && (
          <Step1Category
            value={draft.subCategory}
            onChange={(v: SubCategory) =>
              setDraft({
                ...draft,
                subCategory: v,
                rarity: v === "1of1" ? "unique" : draft.rarity,
                stock: v === "1of1" ? 1 : draft.stock,
              })
            }
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <Step2Media
            value={{ name: draft.name, imageUrl: draft.imageUrl, tags: draft.tags }}
            onChange={(v) => setDraft({ ...draft, ...v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 2 && (
          <Step3PriceStats
            is1of1={draft.subCategory === "1of1"}
            value={{
              rarity: draft.rarity as Rarity,
              priceNeon: draft.priceNeon,
              origin: draft.origin,
              stock: draft.stock,
              stats: draft.stats,
              lore: draft.lore,
            }}
            onChange={(v) => setDraft({ ...draft, ...v })}
            onNext={goNext}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <Step4Preview
            draft={draft}
            isPublishing={isPublishing}
            publishedSlug={publishedSlug}
            onBack={goBack}
            onPublish={onPublish}
          />
        )}
      </StepperShell>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
npx tsc --noEmit
git add app/seller/new/page.tsx
git commit -m "feat: /seller/new 4-step create flow orchestrator"
```

---

## Task 13: e2e — seller publish flow

**Files:**
- Create: `e2e/seller.spec.ts`

- [ ] **Step 1: Test**

```ts
import { test, expect } from "@playwright/test";

test("seller dashboard + publish new listing", async ({ page }) => {
  // Dashboard renders with seeded data
  await page.goto("/seller");
  await expect(page.getByText("// SELLER DASHBOARD")).toBeVisible();
  await expect(page.getByText(/REVENUE/)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Last 30 days")).toBeVisible();
  await expect(page.getByText(/MJOLNIR\.exe|EXCALIBUR\.dll|KUSANAGI\.blade/)).toBeVisible();

  // Start new listing
  await page.getByRole("link", { name: /LIST NEW WEAPON/ }).click();
  await expect(page.getByText("Pick a category")).toBeVisible();

  // Step 1: melee
  await page.getByRole("button", { name: /^Melee/ }).click();
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 2: name + preset image + tag
  await expect(page.getByText("Name & media")).toBeVisible();
  await page.getByPlaceholder("MJOLNIR.exe").fill("PLAYTEST.blade");
  // First preset image
  await page.locator('button[aria-label^="Use /items/"]').first().click();
  await page.getByPlaceholder(/lightning, hammer, norse/).fill("test");
  await page.getByRole("button", { name: /\+ ADD/ }).click();
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 3: leave defaults; set origin and lore
  await expect(page.getByText("Price, stats & lore")).toBeVisible();
  await page.getByPlaceholder(/Norse \/ Greek/).fill("Playtest");
  await page.getByPlaceholder(/One-paragraph backstory/).fill("Auto-test relic.");
  await page.getByRole("button", { name: /CONTINUE/ }).click();

  // Step 4: publish
  await expect(page.getByText("Preview & publish")).toBeVisible();
  await page.getByRole("button", { name: /PUBLISH/ }).click();
  await expect(page.getByText(/LISTING PUBLISHED/)).toBeVisible({ timeout: 12_000 });

  // Verify it appears on /browse search
  await page.goto("/browse?q=playtest");
  await expect(page.getByText("PLAYTEST.blade")).toBeVisible({ timeout: 10_000 });
});
```

- [ ] **Step 2: Run + commit**

```bash
npm run e2e -- e2e/seller.spec.ts
git add e2e/seller.spec.ts
git commit -m "test: e2e for seller dashboard + publish flow"
```

---

## Definition of Done — Plan 4

1. ✅ `/api/listings` GET + POST with full validation (subCategory + rarity + 1of1 invariant)
2. ✅ `/api/stats` returns totals + 30-day sales array
3. ✅ `useListings` exposes both list + `createListing` mutation
4. ✅ `/seller` dashboard shows StatsBar, SalesChart (30-day SVG line), and listings table sorted by revenue
5. ✅ "+ LIST NEW WEAPON" button navigates to `/seller/new`
6. ✅ 4-step stepper validates required fields per step
7. ✅ Publish runs terminal-typewriter mint animation, then green confirmation panel
8. ✅ New listing appears in `/browse` search and `/seller` dashboard immediately
9. ✅ Selecting `1of1` sub-category locks rarity to `unique` and stock to `1`
10. ✅ All unit + integration tests pass; seller e2e passes
11. ✅ `npx tsc --noEmit` and `npm run build` exit 0
