# Cyber-Market — Plan 2: Item Detail Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full `/browse/[slug]` item detail page with HUD-styled stat panel, lore section, related-items rail, and sticky add-to-cart bar. Add the single-item API route + `useItem` hook + `StatHUD` / `GaugeRing` reusable components.

**Architecture:** New dynamic route segment `app/browse/[slug]/page.tsx` (client component) that uses a new `useItem(slug)` SWR hook calling a new `GET /api/items/[slug]` route handler. Reuses existing decorative/feedback components. Adds a stat-bar component family that renders `Weapon.stats` as 4 animated HUD readouts plus a single `GaugeRing` showing relative price-to-median. Adds a `<RelatedItems>` rail that fetches by sub-category. Add-to-cart wires up via a new `useCart` placeholder (calls TODO until Plan 3 ships the cart API — for now it just dispatches a toast and locally tracks cart size).

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · `@rintran720/cyberpunk-ui` · SWR

**Spec reference:** `docs/superpowers/specs/2026-04-30-cyber-market-design.md` — sections 3, 5, 6.3, 7, 8.

**Out of scope (later plans):**
- Real cart persistence and POST /api/cart (Plan 3)
- Checkout flow (Plan 3)
- Profile, Orders, Seller (Plans 3-4)
- Glow toggle / animation polish / a11y audit (Plan 5)

---

## File Structure (created or modified by this plan)

| File | Responsibility |
|---|---|
| `app/api/items/[slug]/route.ts` | GET single weapon by slug, 404 if missing |
| `lib/client/hooks/useItem.ts` | SWR wrapper for single-item endpoint |
| `lib/client/hooks/useCart.ts` (stub) | Returns cart count + `addItem(slug, qty)` that pushes to a Zustand-light atom and shows toast |
| `lib/client/cart-store.ts` | Tiny in-memory store (Map<slug,qty>) with subscribe pattern; replaced by API in Plan 3 |
| `components/item/StatHUD.tsx` | Single labelled stat with bar + count-up |
| `components/item/StatGrid.tsx` | 4-stat grid wrapping `StatHUD` for `Weapon.stats` |
| `components/item/GaugeRing.tsx` | Circular gauge (stroke-dashoffset) — value vs max with label |
| `components/item/RelatedItems.tsx` | Horizontal scroll rail (4 items) — uses `useItems` filtered by sub-category |
| `components/item/QtyStepper.tsx` | `[-] 1 [+]` count stepper for add-to-cart |
| `components/item/AddToCartBar.tsx` | Sticky bottom bar (price + stepper + button) |
| `app/browse/[slug]/page.tsx` | Detail page (client component) |
| `app/browse/[slug]/error.tsx` | Local error boundary |
| `app/browse/[slug]/loading.tsx` | Skeleton fallback |
| `tests/items-by-slug-api.test.ts` | Vitest for single-item route handler |
| `tests/useCart-store.test.ts` | Vitest for cart store add/remove/qty/subscribe |
| `e2e/item-detail.spec.ts` | Playwright: navigate from /browse → click card → preview dialog → click VIEW FULL → arrives on detail page → adds to cart → toast appears |

---

## Task 1: Single-item API route handler (TDD)

**Files:**
- Create: `app/api/items/[slug]/route.ts`, `tests/items-by-slug-api.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/items-by-slug-api.test.ts
import { describe, it, expect, vi } from "vitest";
import { GET } from "@/app/api/items/[slug]/route";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const reqWith = (slug: string) =>
  ({ params: Promise.resolve({ slug }) }) as { params: Promise<{ slug: string }> };

describe("GET /api/items/[slug]", () => {
  it("returns 200 + weapon for known slug", async () => {
    const res = await GET(new Request("http://x"), reqWith("mjolnir-exe"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.slug).toBe("mjolnir-exe");
    expect(body.name).toBe("MJOLNIR.exe");
  });

  it("returns 404 for unknown slug", async () => {
    const res = await GET(new Request("http://x"), reqWith("does-not-exist"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- tests/items-by-slug-api.test.ts
```

Expected: module-not-found error.

- [ ] **Step 3: Implement `app/api/items/[slug]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { getWeaponBySlug } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    const { slug } = await ctx.params;
    const weapon = getWeaponBySlug(slug);
    if (!weapon) throw new ApiError(404, "NOT_FOUND", `No weapon with slug "${slug}"`);
    return NextResponse.json(weapon);
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 4: Run — expect PASS (2/2)**

```bash
npm test -- tests/items-by-slug-api.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add app/api/items/[slug]/route.ts tests/items-by-slug-api.test.ts
git commit -m "feat: GET /api/items/[slug] with 404 on missing"
```

---

## Task 2: useItem SWR hook

**Files:**
- Create: `lib/client/hooks/useItem.ts`

- [ ] **Step 1: Create the hook**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { Weapon } from "@/lib/client/types";

export function useItem(slug: string | undefined) {
  const key = slug ? `/api/items/${encodeURIComponent(slug)}` : null;
  const { data, error, isLoading, mutate } = useSWR<Weapon>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 800,
    dedupingInterval: 2000,
  });
  return { item: data, isLoading, error, mutate };
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/client/hooks/useItem.ts
git commit -m "feat: useItem SWR hook for single-weapon lookup"
```

---

## Task 3: Cart store + useCart stub (TDD)

**Files:**
- Create: `lib/client/cart-store.ts`, `lib/client/hooks/useCart.ts`, `tests/useCart-store.test.ts`

The cart store is a temporary in-memory pub-sub. Plan 3 replaces it with an API-backed implementation, but the public hook signature stays the same so callers don't change.

- [ ] **Step 1: Write failing tests**

```ts
// tests/useCart-store.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { cartStore } from "@/lib/client/cart-store";

describe("cartStore", () => {
  beforeEach(() => cartStore.clear());

  it("starts empty", () => {
    expect(cartStore.getCount()).toBe(0);
    expect(cartStore.getLines()).toEqual([]);
  });

  it("adds and increments quantity", () => {
    cartStore.add("mjolnir-exe", 1);
    cartStore.add("mjolnir-exe", 2);
    expect(cartStore.getCount()).toBe(3);
    expect(cartStore.getLines()).toEqual([{ slug: "mjolnir-exe", qty: 3 }]);
  });

  it("removes when qty drops to 0", () => {
    cartStore.add("mjolnir-exe", 1);
    cartStore.update("mjolnir-exe", 0);
    expect(cartStore.getCount()).toBe(0);
    expect(cartStore.getLines()).toEqual([]);
  });

  it("notifies subscribers on change", () => {
    let n = 0;
    const unsub = cartStore.subscribe(() => (n += 1));
    cartStore.add("a", 1);
    cartStore.add("b", 1);
    cartStore.update("a", 2);
    cartStore.remove("b");
    unsub();
    cartStore.add("c", 1); // should not fire after unsub
    expect(n).toBe(4);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- tests/useCart-store.test.ts
```

- [ ] **Step 3: Implement `lib/client/cart-store.ts`**

```ts
type Line = { slug: string; qty: number };

class CartStore {
  private map = new Map<string, number>();
  private subs = new Set<() => void>();

  getLines(): Line[] {
    return Array.from(this.map.entries()).map(([slug, qty]) => ({ slug, qty }));
  }
  getCount(): number {
    let n = 0;
    for (const q of this.map.values()) n += q;
    return n;
  }
  add(slug: string, qty = 1): void {
    const cur = this.map.get(slug) ?? 0;
    const next = cur + qty;
    if (next <= 0) this.map.delete(slug);
    else this.map.set(slug, next);
    this.notify();
  }
  update(slug: string, qty: number): void {
    if (qty <= 0) this.map.delete(slug);
    else this.map.set(slug, qty);
    this.notify();
  }
  remove(slug: string): void {
    this.map.delete(slug);
    this.notify();
  }
  clear(): void {
    this.map.clear();
    this.notify();
  }
  subscribe(fn: () => void): () => void {
    this.subs.add(fn);
    return () => this.subs.delete(fn);
  }
  private notify(): void {
    for (const fn of this.subs) fn();
  }
}

export const cartStore = new CartStore();
```

- [ ] **Step 4: Implement `lib/client/hooks/useCart.ts`**

```ts
"use client";

import { useEffect, useState } from "react";
import { cartStore } from "@/lib/client/cart-store";

export function useCart() {
  const [, setTick] = useState(0);
  useEffect(() => cartStore.subscribe(() => setTick((n) => n + 1)), []);
  return {
    count: cartStore.getCount(),
    lines: cartStore.getLines(),
    addItem: (slug: string, qty = 1) => cartStore.add(slug, qty),
    updateQty: (slug: string, qty: number) => cartStore.update(slug, qty),
    removeItem: (slug: string) => cartStore.remove(slug),
    clear: () => cartStore.clear(),
  };
}
```

- [ ] **Step 5: Run — expect PASS (4/4)**

```bash
npm test -- tests/useCart-store.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add lib/client/cart-store.ts lib/client/hooks/useCart.ts tests/useCart-store.test.ts
git commit -m "feat: in-memory cart store + useCart hook (Plan 3 replaces with API-backed)"
```

---

## Task 4: StatHUD + StatGrid components

**Files:**
- Create: `components/item/StatHUD.tsx`, `components/item/StatGrid.tsx`

- [ ] **Step 1: Create `components/item/StatHUD.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

type Hue = "cyan" | "magenta" | "yellow" | "green" | "purple";

type Props = {
  label: string;
  value: number;
  max?: number;
  hue?: Hue;
};

const TEXT: Record<Hue, string> = {
  cyan: "text-cp-cyan-500",
  magenta: "text-cp-magenta-500",
  yellow: "text-cp-yellow-500",
  green: "text-cp-green-500",
  purple: "text-cp-purple-500",
};

export function StatHUD({ label, value, max = 100, hue = "cyan" }: Props) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 600;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="border border-cp-border p-3 bg-cp-bg-soft">
      <div className="font-cp-mono text-[9px] tracking-[0.3em] text-cp-fg-muted uppercase">{label}</div>
      <div className={`font-cp-mono text-2xl font-bold mt-1 ${TEXT[hue]}`}>{shown}</div>
      <div className="h-1 mt-2 bg-cp-bg overflow-hidden">
        <div
          className="h-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background: `var(--cp-${hue}-500)`,
            boxShadow: `0 0 8px var(--cp-${hue}-500)`,
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/item/StatGrid.tsx`**

```tsx
import type { WeaponStats } from "@/lib/client/types";
import { StatHUD } from "./StatHUD";

export function StatGrid({ stats }: { stats: WeaponStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatHUD label="DAMAGE" value={stats.damage} hue="cyan" />
      <StatHUD label="SPEED" value={stats.speed} hue="green" />
      <StatHUD label="RANGE" value={stats.range} hue="yellow" />
      <StatHUD label="SOUL COST" value={stats.soulCost} hue="magenta" />
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/item/StatHUD.tsx components/item/StatGrid.tsx
git commit -m "feat: StatHUD + StatGrid components with count-up animation"
```

---

## Task 5: GaugeRing component

**Files:**
- Create: `components/item/GaugeRing.tsx`

The gauge is a circular ring with a partial fill that animates from 0 to its target value over 700ms.

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useEffect, useState } from "react";

type Props = {
  value: number;
  max: number;
  label: string;
  suffix?: string;
  size?: number; // px
  hue?: "cyan" | "magenta" | "yellow" | "green";
};

const HUE_HEX: Record<NonNullable<Props["hue"]>, string> = {
  cyan: "#00f0ff",
  magenta: "#ff00ea",
  yellow: "#fcee0a",
  green: "#39ff14",
};

export function GaugeRing({
  value,
  max,
  label,
  suffix = "",
  size = 140,
  hue = "cyan",
}: Props) {
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const [animPct, setAnimPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimPct(pct * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  const dashoffset = c * (1 - animPct);
  const color = HUE_HEX[hue];

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--cp-border)"
          strokeWidth="6"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
        <text
          x={size / 2}
          y={size / 2 + 6}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          fontSize="22"
          fill={color}
        >
          {Math.round(value)}
          {suffix}
        </text>
      </svg>
      <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted uppercase">
        {label}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/item/GaugeRing.tsx
git commit -m "feat: GaugeRing animated circular SVG gauge"
```

---

## Task 6: QtyStepper + AddToCartBar

**Files:**
- Create: `components/item/QtyStepper.tsx`, `components/item/AddToCartBar.tsx`

- [ ] **Step 1: Create `QtyStepper.tsx`**

```tsx
"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export function QtyStepper({ value, min = 1, max = 99, onChange }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex border border-cp-border" role="group" aria-label="Quantity">
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className="px-3 py-2 font-cp-mono text-cp-cyan-500 hover:bg-cp-cyan-500/10 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        type="number"
        className="w-12 text-center bg-cp-bg-soft text-cp-fg font-cp-mono"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className="px-3 py-2 font-cp-mono text-cp-cyan-500 hover:bg-cp-cyan-500/10 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `AddToCartBar.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Weapon } from "@/lib/client/types";
import { useCart } from "@/lib/client/hooks/useCart";
import { formatNeon } from "@/lib/format";
import { QtyStepper } from "./QtyStepper";

export function AddToCartBar({ weapon }: { weapon: Weapon }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [pulse, setPulse] = useState(false);
  const soldOut = weapon.stock === 0;
  const max = Math.max(1, weapon.stock);

  const onAdd = () => {
    addItem(weapon.slug, qty);
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-cp-border bg-cp-bg/95 backdrop-blur">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">PRICE</div>
          <div className="font-cp-mono text-2xl text-cp-yellow-500 font-bold">
            {formatNeon(weapon.priceNeon * qty, { compact: true })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <QtyStepper value={qty} min={1} max={max} onChange={setQty} />
          <button
            type="button"
            disabled={soldOut}
            onClick={onAdd}
            className={`px-7 py-3 font-cp-display font-bold tracking-widest hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed ${
              pulse ? "scale-105" : ""
            }`}
            style={{
              background: "var(--cp-magenta-500, #ff00ea)",
              color: "#04050b",
              clipPath:
                "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              boxShadow: pulse ? "0 0 30px rgba(255,0,234,0.7)" : "0 0 15px rgba(255,0,234,0.4)",
              transition: "all 200ms ease",
            }}
          >
            {soldOut ? "SOLD OUT" : "⟁ ADD TO CART"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/item/QtyStepper.tsx components/item/AddToCartBar.tsx
git commit -m "feat: QtyStepper + sticky AddToCartBar with pulse on add"
```

---

## Task 7: RelatedItems rail

**Files:**
- Create: `components/item/RelatedItems.tsx`

- [ ] **Step 1: Create the file**

```tsx
"use client";

import { useItems } from "@/lib/client/hooks/useItems";
import { ItemCard } from "./ItemCard";
import { ItemCardSkeleton } from "@/components/feedback/Skeleton";
import type { Weapon } from "@/lib/client/types";

export function RelatedItems({ current }: { current: Weapon }) {
  const { items, isLoading } = useItems({
    subCategories: [current.subCategory],
    sort: "rarity",
  });
  const others = items.filter((w) => w.slug !== current.slug).slice(0, 4);
  if (!isLoading && others.length === 0) return null;

  return (
    <section>
      <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-1">
        // COMPATIBLE
      </div>
      <h3 className="font-cp-display text-2xl text-cp-fg mb-4">
        Other {current.subCategory.replace("-", " ")} weapons
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)
          : others.map((w, i) => <ItemCard key={w.slug} weapon={w} index={i} />)}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/item/RelatedItems.tsx
git commit -m "feat: RelatedItems rail filtered by sub-category"
```

---

## Task 8: Item Detail page

**Files:**
- Create: `app/browse/[slug]/page.tsx`, `app/browse/[slug]/loading.tsx`, `app/browse/[slug]/error.tsx`

- [ ] **Step 1: Create `app/browse/[slug]/loading.tsx`**

```tsx
export default function Loading() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div className="cp-skeleton" style={{ aspectRatio: "1/1", width: "100%" }} />
      <div className="flex flex-col gap-4">
        <div className="cp-skeleton" style={{ height: 36, width: "70%" }} />
        <div className="cp-skeleton" style={{ height: 18, width: "40%" }} />
        <div className="cp-skeleton" style={{ height: 100, width: "100%" }} />
        <div className="grid grid-cols-4 gap-3">
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
          <div className="cp-skeleton" style={{ height: 80 }} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `app/browse/[slug]/error.tsx`**

```tsx
"use client";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/ErrorState";

export default function ItemError({ error, reset }: { error: Error; reset: () => void }) {
  const code = (error as { code?: string }).code ?? "UNKNOWN";
  const isNotFound = code === "NOT_FOUND";
  return (
    <div className="py-16">
      <ErrorState
        code={code}
        message={isNotFound ? "This weapon is not in the registry." : error.message}
        retry={isNotFound ? undefined : reset}
      />
      <div className="mt-6 text-center">
        <Link href="/browse" className="cp-btn cp-btn--ghost cp-btn--cyan">
          ‹ BACK TO ARSENAL
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `app/browse/[slug]/page.tsx`**

```tsx
"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useItem } from "@/lib/client/hooks/useItem";
import { useItems } from "@/lib/client/hooks/useItems";
import { RarityBadge, rarityColor } from "@/components/item/RarityBadge";
import { StockIndicator } from "@/components/item/StockIndicator";
import { StatGrid } from "@/components/item/StatGrid";
import { GaugeRing } from "@/components/item/GaugeRing";
import { AddToCartBar } from "@/components/item/AddToCartBar";
import { RelatedItems } from "@/components/item/RelatedItems";
import { ErrorState } from "@/components/feedback/ErrorState";
import Loading from "./loading";
import { formatNeon } from "@/lib/format";

export default function ItemDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const { item, isLoading, error, mutate } = useItem(slug);
  const { items: peers } = useItems({ subCategories: item ? [item.subCategory] : [] });

  if (isLoading) return <Loading />;
  if (error || !item) {
    return (
      <ErrorState
        code={(error as { code?: string } | undefined)?.code}
        message={error?.message ?? "Weapon not found"}
        retry={() => mutate()}
      />
    );
  }

  const median =
    peers.length > 0
      ? peers.map((w) => w.priceNeon).sort((a, b) => a - b)[Math.floor(peers.length / 2)]
      : item.priceNeon;
  const ratio = (item.priceNeon / Math.max(1, median)) * 50;
  const ratioCapped = Math.min(100, ratio);
  const color = rarityColor(item.rarity);

  return (
    <div className="flex flex-col gap-12 pb-24">
      <Link
        href="/browse"
        className="font-cp-mono text-[11px] tracking-[0.3em] text-cp-fg-muted hover:text-cp-cyan-500"
      >
        ‹ BACK TO ARSENAL
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* IMAGE */}
        <div
          className={`relative aspect-square overflow-hidden cp-card cp-card--cut cp-card--${color}`}
        >
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="cp-scanlines absolute inset-0 pointer-events-none" />
          <div className="absolute top-3 left-3"><RarityBadge rarity={item.rarity} size="md" /></div>
          <div className="absolute top-3 right-3"><StockIndicator stock={item.stock} /></div>
          <div className="absolute bottom-3 left-3 font-cp-mono text-[10px] tracking-[0.3em] text-cp-cyan-500">
            // {item.subCategory.replace("-", " ").toUpperCase()}
          </div>
        </div>

        {/* INFO */}
        <div className="flex flex-col gap-6">
          <div>
            <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-magenta-500 mb-2">
              // PROVENANCE · {item.origin}
            </div>
            <h1
              className="cp-heading cp-heading--lg cp-heading--glitch text-cp-fg"
              data-text={item.name}
            >
              {item.name}
            </h1>
            <p className="text-cp-fg-muted text-sm mt-2">Listed by {item.seller}</p>
          </div>

          <p className="text-cp-fg leading-relaxed">{item.lore}</p>

          <StatGrid stats={item.stats} />

          <div className="flex items-center gap-6 border-t border-cp-border pt-4">
            <GaugeRing
              value={Math.round(ratioCapped)}
              max={100}
              label="vs median"
              suffix="%"
              hue={ratio > 100 ? "magenta" : "cyan"}
            />
            <div>
              <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">
                MARKET POSITION
              </div>
              <p className="text-cp-fg-muted text-sm mt-1 max-w-xs">
                Median price for {item.subCategory.replace("-", " ")} is{" "}
                <span className="font-cp-mono text-cp-yellow-500">
                  {formatNeon(median, { compact: true })}
                </span>
                . This listing is {ratio > 100 ? "above" : "at or below"} median.
              </p>
            </div>
          </div>

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((t) => (
                <span key={t} className={`cp-chip cp-chip--${color}`}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <RelatedItems current={item} />

      <AddToCartBar weapon={item} />
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

Start dev server (or use running). With browser/curl:

```bash
node -e '
const http=require("http");
http.get("http://localhost:3000/browse/mjolnir-exe",r=>{
  let b=""; r.on("data",c=>b+=c);
  r.on("end",()=>{
    console.log("status=",r.statusCode,"len=",b.length);
    const ok=["MJOLNIR.exe","DAMAGE","SPEED","RANGE","SOUL COST","ADD TO CART","BACK TO ARSENAL","COMPATIBLE"].every(s=>b.includes(s));
    console.log("markers=",ok?"ALL":"MISSING");
  });
});
'
```

Expected: `status=200 markers=ALL`.

- [ ] **Step 5: Commit**

```bash
git add app/browse/[slug]
git commit -m "feat: /browse/[slug] item detail page with stats, gauge, related, sticky add-to-cart"
```

---

## Task 9: Wire dialog "VIEW FULL" into router

The `ItemPreviewDialog` already has a `<Link href="/browse/${slug}">VIEW FULL ›</Link>`. Verify it navigates correctly now that the page exists.

**Files:**
- No code changes (verification task)

- [ ] **Step 1: Manual verify with Playwright**

```bash
node -e '
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto("http://localhost:3000/browse");
  await p.waitForSelector("button[aria-label=\"Preview MJOLNIR.exe\"]");
  await p.click("button[aria-label=\"Preview MJOLNIR.exe\"]");
  await p.waitForSelector("text=PROVENANCE");
  await p.click("text=VIEW FULL");
  await p.waitForURL(/\\/browse\\/mjolnir-exe/);
  await p.waitForSelector("text=DAMAGE");
  console.log("navigation+detail OK");
  await b.close();
})();
' 2>&1 | tail -5
```

Expected: `navigation+detail OK`.

- [ ] **Step 2: Commit (no code, just verification log)**

If anything failed, fix and commit. Otherwise no-op.

---

## Task 10: Show cart count in header

**Files:**
- Modify: `components/layout/Header.tsx`

The Header currently shows a hardcoded balance and no cart link. Add a cart-count badge next to the wallet chip.

- [ ] **Step 1: Modify Header**

Replace the right-side block of `Header.tsx`:

```tsx
// At top of file, after existing imports:
"use client";
import Link from "next/link";
import { formatNeon } from "@/lib/format";
import { useCart } from "@/lib/client/hooks/useCart";

const HARDCODED_BALANCE = 250_000;

export function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-cp-border bg-cp-bg/80 backdrop-blur">
      <div className="cp-container flex items-center gap-6 py-3">
        <Link href="/" className="font-cp-display text-cp-cyan-500 text-lg tracking-widest">
          ⌬ NEONMARKET
        </Link>
        <nav className="flex gap-4 text-sm uppercase tracking-wider">
          <Link href="/browse" className="text-cp-fg hover:text-cp-cyan-500">Browse</Link>
          <Link href="/orders" className="text-cp-fg-muted hover:text-cp-cyan-500">Orders</Link>
          <Link href="/seller" className="text-cp-fg-muted hover:text-cp-cyan-500">Seller</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/cart"
            className="relative cp-chip cp-chip--cyan font-cp-mono text-xs"
            aria-label={`Cart, ${count} items`}
          >
            ⌗ CART
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-cp-magenta-500 text-cp-bg font-bold text-[10px] flex items-center justify-center shadow-cp-glow-magenta">
                {count}
              </span>
            )}
          </Link>
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

- [ ] **Step 2: Type-check + smoke**

```bash
npx tsc --noEmit
```

Open `/browse/mjolnir-exe` in dev, click ADD TO CART once. Header cart badge should show `1`. Click again → `2`.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat: header cart link with live count badge"
```

---

## Task 11: Playwright e2e for detail flow

**Files:**
- Create: `e2e/item-detail.spec.ts`

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from "@playwright/test";

test("item detail flow: home → preview dialog → full detail → add to cart", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("ARSENAL OF MYTHS")).toBeVisible();

  await page.goto("/browse/mjolnir-exe");
  await expect(page.getByText("DAMAGE")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("SPEED")).toBeVisible();
  await expect(page.getByText("RANGE")).toBeVisible();
  await expect(page.getByText("SOUL COST")).toBeVisible();
  await expect(page.getByText("vs median")).toBeVisible();
  await expect(page.getByText(/Other (melee|ranged|energy.divine|cursed) weapons/)).toBeVisible();

  // Increment qty + add to cart
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await page.getByRole("button", { name: /ADD TO CART/ }).click();

  // Header cart badge updates
  await expect(page.getByLabel(/Cart,/)).toBeVisible();
  await expect(page.locator("header").getByText("2")).toBeVisible({ timeout: 5_000 });

  // 404 path
  await page.goto("/browse/does-not-exist");
  await expect(page.getByText("[NOT_FOUND]")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("link", { name: /BACK TO ARSENAL/ })).toBeVisible();
});
```

- [ ] **Step 2: Run e2e**

```bash
npm run e2e -- e2e/item-detail.spec.ts
```

Expected: 1 passing test (re-run if a 5% simulated 503 hits during the test; 2 retries built into SWR should usually mask this).

- [ ] **Step 3: Commit**

```bash
git add e2e/item-detail.spec.ts
git commit -m "test: e2e for item detail flow + 404"
```

---

## Definition of Done — Plan 2

1. ✅ `GET /api/items/[slug]` returns 200 for known slugs and 404 for unknown
2. ✅ `useItem(slug)` hook works in client components
3. ✅ Cart store + `useCart` count updates trigger re-render
4. ✅ `/browse/[slug]` renders: image with rarity-coloured panel, glitch heading, lore, 4 stat HUDs with count-up, gauge ring vs median, tag chips, related-items rail, sticky add-to-cart bar
5. ✅ ADD TO CART increments header cart badge
6. ✅ Unknown slug shows `[NOT_FOUND]` error state with BACK TO ARSENAL link
7. ✅ All unit + integration tests pass; Playwright detail e2e passes
8. ✅ `npx tsc --noEmit` exits 0
9. ✅ `npm run build` exits 0
