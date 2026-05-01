# Cyber-Market — Plan 3: Transactions (Wallet · Cart API · Checkout · Orders · Profile)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-memory cart store from Plan 2 with a real mock-API-backed cart, add wallet + checkout + orders endpoints + UI, and ship the Profile page. After this plan, a user can browse → add to cart → checkout → see the order in history → see purchases in their inventory.

**Architecture:** Five new mock-API route handlers (`/api/cart`, `/api/cart/[slug]`, `/api/wallet`, `/api/checkout`, `/api/orders`) backed by the existing `lib/api/store.ts` (extended with cart/wallet/orders state). New SWR hooks (`useCart`, `useWallet`, `useCheckout`, `useOrders`) replace the temporary cart store while keeping the public `useCart` shape compatible. The Header reads the real wallet balance. Three new pages (`/cart`, `/checkout`, `/orders`, `/profile`) plus the cart drawer. Checkout shows a dramatic terminal-typewriter modal that prints handshake/verifying/tx-confirmed lines before resolving with a tx-hash and pushing the order into history.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind v4 · `@rintran720/cyberpunk-ui` · SWR (with mutations + optimistic updates)

**Spec reference:** `docs/superpowers/specs/2026-04-30-cyber-market-design.md` — sections 3, 4 (full endpoint contracts), 5, 6.4–6.6, 6.8, 8.

**Out of scope (later plans):**
- Seller dashboard + create flow (Plan 4)
- Glow toggle, animation polish, a11y audit (Plan 5)

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/api/store.ts` (modify) | Add `cart`, `wallet`, `orders` state + helpers (`addCartLine`, `setCartQty`, `clearCart`, `getCartLines`, `getWallet`, `setWalletBalance`, `pushOrder`, `getOrders`) |
| `lib/api/seed/orders.json` | 6 historical orders pre-seeded |
| `app/api/cart/route.ts` | GET cart, POST add line, DELETE clear |
| `app/api/cart/[slug]/route.ts` | PATCH qty, DELETE single line |
| `app/api/wallet/route.ts` | GET wallet, POST topup (debug) |
| `app/api/checkout/route.ts` | POST checkout → returns Order + new wallet, pushes to orders, clears cart |
| `app/api/orders/route.ts` | GET user orders (newest first) |
| `lib/client/hooks/useCart.ts` (rewrite) | API-backed cart with optimistic mutations |
| `lib/client/hooks/useWallet.ts` | SWR wrapper |
| `lib/client/hooks/useCheckout.ts` | Mutation hook returning `{checkout, isProcessing, lastTx}` |
| `lib/client/hooks/useOrders.ts` | SWR wrapper |
| `lib/client/cart-store.ts` (DELETE) | Removed, replaced by API |
| `tests/cart-api.test.ts` | Vitest for cart route handlers |
| `tests/wallet-api.test.ts` | Vitest for wallet GET/POST |
| `tests/checkout-api.test.ts` | Vitest for checkout (success, insufficient, congestion) |
| `components/cart/CartLine.tsx` | Single cart row (image + name + qty stepper + line total + remove) |
| `components/cart/CartDrawer.tsx` | Right-edge drawer with mini cart |
| `components/cart/CheckoutTerminal.tsx` | Modal that runs typewriter sequence then resolves |
| `components/feedback/Toaster.tsx` | Tiny toast queue used by mutations |
| `components/layout/Header.tsx` (modify) | Real wallet balance via `useWallet` |
| `app/cart/page.tsx` | Full cart page |
| `app/checkout/page.tsx` | 3-step stepper + terminal modal |
| `app/orders/page.tsx` | Order history timeline |
| `app/profile/page.tsx` | Inventory + viewed history (tabs) |
| `e2e/cart-checkout.spec.ts` | Playwright happy path: add → checkout → order appears → balance decreased |

---

## Task 1: Extend in-memory store (cart, wallet, orders)

**Files:**
- Modify: `lib/api/store.ts`
- Create: `lib/api/seed/orders.json`

- [ ] **Step 1: Create `lib/api/seed/orders.json`**

```json
[
  { "id": "ord_001", "txHash": "0x9a2f1b7e0c4d3a82f6e9b1c75d3e2a6f", "lines": [{"itemSlug":"shadow-katar","qty":1,"addedAt":"2185-03-15T10:00:00Z"}], "total": 850, "status": "confirmed", "createdAt": "2185-03-15T10:01:24Z" },
  { "id": "ord_002", "txHash": "0x3b8c9d04e7f2a1b6d5c4e3f29a1b0c7e", "lines": [{"itemSlug":"phoenix-quiver","qty":2,"addedAt":"2185-03-22T14:30:00Z"}], "total": 1960, "status": "confirmed", "createdAt": "2185-03-22T14:31:55Z" },
  { "id": "ord_003", "txHash": "0xff1e7c4b8d9a2e3f04c1b6d5e2f3a4b9", "lines": [{"itemSlug":"vajra-mace","qty":1,"addedAt":"2185-04-02T09:15:00Z"}], "total": 3100, "status": "confirmed", "createdAt": "2185-04-02T09:16:42Z" },
  { "id": "ord_004", "txHash": "0x42f08e1d3b6c7a5f9e0d4c2b8a1f3e6d", "lines": [{"itemSlug":"ankh-blade","qty":1,"addedAt":"2185-04-10T19:00:00Z"},{"itemSlug":"feather-of-maat","qty":3,"addedAt":"2185-04-10T19:00:00Z"}], "total": 1235, "status": "confirmed", "createdAt": "2185-04-10T19:02:11Z" },
  { "id": "ord_005", "txHash": "0xa7c3b9e1f4d6028b5a0c7e3f4d2b1a6e", "lines": [{"itemSlug":"bow-of-artemis","qty":1,"addedAt":"2185-04-18T11:45:00Z"}], "total": 2400, "status": "confirmed", "createdAt": "2185-04-18T11:46:33Z" },
  { "id": "ord_006", "txHash": "0x0e5d3a8b2c7f1e4d6b9a0f3c2e1d4b5a", "lines": [{"itemSlug":"loki-dagger","qty":1,"addedAt":"2185-04-26T08:20:00Z"}], "total": 1100, "status": "confirmed", "createdAt": "2185-04-26T08:21:08Z" }
]
```

- [ ] **Step 2: Replace `lib/api/store.ts` with extended version**

```ts
import seedWeapons from "./seed/weapons.json";
import seedOrders from "./seed/orders.json";
import type { CartLine, Order, Wallet, Weapon } from "@/lib/client/types";

const FEE_RATE = 0.02;

type Store = {
  weapons: Weapon[];
  cart: Map<string, number>; // slug → qty
  wallet: Wallet;
  orders: Order[];
};

const store: Store = {
  weapons: seedWeapons as Weapon[],
  cart: new Map(),
  wallet: { balanceNeon: 250_000, address: "0xJohnT...4ran" },
  orders: (seedOrders as Order[]).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
};

// Weapons
export const getAllWeapons = (): Weapon[] => store.weapons;
export const getWeaponBySlug = (slug: string): Weapon | undefined =>
  store.weapons.find((w) => w.slug === slug);

// Cart
export const getCartLines = (): CartLine[] =>
  Array.from(store.cart.entries()).map(([slug, qty]) => ({
    itemSlug: slug,
    qty,
    addedAt: new Date().toISOString(),
  }));

export const getCartItems = (): Weapon[] => {
  const items: Weapon[] = [];
  for (const slug of store.cart.keys()) {
    const w = getWeaponBySlug(slug);
    if (w) items.push(w);
  }
  return items;
};

export const getCartTotals = () => {
  let subtotal = 0;
  for (const [slug, qty] of store.cart.entries()) {
    const w = getWeaponBySlug(slug);
    if (w) subtotal += w.priceNeon * qty;
  }
  const fee = Math.round(subtotal * FEE_RATE);
  return { subtotal, fee, total: subtotal + fee };
};

export const addCartLine = (slug: string, qty: number): void => {
  if (qty <= 0) return;
  const cur = store.cart.get(slug) ?? 0;
  store.cart.set(slug, cur + qty);
};

export const setCartQty = (slug: string, qty: number): void => {
  if (qty <= 0) store.cart.delete(slug);
  else store.cart.set(slug, qty);
};

export const removeCartLine = (slug: string): void => {
  store.cart.delete(slug);
};

export const clearCart = (): void => {
  store.cart.clear();
};

// Wallet
export const getWallet = (): Wallet => ({ ...store.wallet });
export const setWalletBalance = (n: number): void => {
  store.wallet.balanceNeon = n;
};

// Orders
export const getOrders = (): Order[] => store.orders.slice();
export const pushOrder = (order: Order): void => {
  store.orders.unshift(order);
};
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/api/store.ts lib/api/seed/orders.json
git commit -m "feat: extend in-memory store with cart, wallet, orders"
```

---

## Task 2: Cart API route handlers (TDD)

**Files:**
- Create: `app/api/cart/route.ts`, `app/api/cart/[slug]/route.ts`, `tests/cart-api.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/cart-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/cart/route";
import { PATCH as PATCH_LINE, DELETE as DELETE_LINE } from "@/app/api/cart/[slug]/route";
import { clearCart } from "@/lib/api/store";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

const req = (body?: object) =>
  new Request("http://x/api/cart", {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : {},
  });

const slugCtx = (slug: string) => ({ params: Promise.resolve({ slug }) });

beforeEach(() => clearCart());

describe("Cart API", () => {
  it("GET empty cart returns subtotal/fee/total = 0", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.lines).toEqual([]);
    expect(body.subtotal).toBe(0);
    expect(body.fee).toBe(0);
    expect(body.total).toBe(0);
  });

  it("POST adds a line, GET reflects it with 2% fee", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 2 }));
    const res = await GET();
    const body = await res.json();
    expect(body.lines).toHaveLength(1);
    expect(body.lines[0]).toMatchObject({ itemSlug: "mjolnir-exe", qty: 2 });
    expect(body.subtotal).toBe(8400); // 2 × 4200
    expect(body.fee).toBe(168); // 2%
    expect(body.total).toBe(8568);
  });

  it("POST 400 on unknown slug", async () => {
    const res = await POST(req({ slug: "no-such", qty: 1 }));
    expect(res.status).toBe(400);
  });

  it("PATCH /api/cart/[slug] sets qty", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    const patchReq = new Request("http://x", {
      method: "PATCH",
      body: JSON.stringify({ qty: 5 }),
      headers: { "content-type": "application/json" },
    });
    await PATCH_LINE(patchReq, slugCtx("mjolnir-exe"));
    const body = await (await GET()).json();
    expect(body.lines[0].qty).toBe(5);
  });

  it("DELETE /api/cart/[slug] removes line", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    await DELETE_LINE(new Request("http://x"), slugCtx("mjolnir-exe"));
    const body = await (await GET()).json();
    expect(body.lines).toEqual([]);
  });

  it("DELETE /api/cart clears all", async () => {
    await POST(req({ slug: "mjolnir-exe", qty: 1 }));
    await POST(req({ slug: "excalibur-dll", qty: 2 }));
    await DELETE();
    const body = await (await GET()).json();
    expect(body.lines).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

```bash
npm test -- tests/cart-api.test.ts
```

- [ ] **Step 3: Implement `app/api/cart/route.ts`**

```ts
import { NextResponse } from "next/server";
import {
  addCartLine,
  clearCart,
  getCartItems,
  getCartLines,
  getCartTotals,
  getWeaponBySlug,
} from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

function payload() {
  return {
    lines: getCartLines(),
    items: getCartItems(),
    ...getCartTotals(),
  };
}

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const body = (await req.json()) as { slug?: string; qty?: number };
    const slug = body.slug;
    const qty = Math.max(1, Math.floor(body.qty ?? 1));
    if (!slug || !getWeaponBySlug(slug)) {
      throw new ApiError(400, "BAD_SLUG", `Unknown weapon slug: ${slug}`);
    }
    addCartLine(slug, qty);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    clearCart();
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 4: Implement `app/api/cart/[slug]/route.ts`**

```ts
import { NextResponse } from "next/server";
import {
  getCartItems,
  getCartLines,
  getCartTotals,
  getWeaponBySlug,
  removeCartLine,
  setCartQty,
} from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, maybeError, toErrorResponse } from "@/lib/api/error";

function payload() {
  return {
    lines: getCartLines(),
    items: getCartItems(),
    ...getCartTotals(),
  };
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const { slug } = await ctx.params;
    if (!getWeaponBySlug(slug)) {
      throw new ApiError(400, "BAD_SLUG", `Unknown weapon slug: ${slug}`);
    }
    const body = (await req.json()) as { qty?: number };
    const qty = Math.max(0, Math.floor(body.qty ?? 0));
    setCartQty(slug, qty);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const { slug } = await ctx.params;
    removeCartLine(slug);
    return NextResponse.json(payload());
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 5: Run — expect PASS (6/6)**

```bash
npm test -- tests/cart-api.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/api/cart tests/cart-api.test.ts
git commit -m "feat: cart API routes (GET/POST/PATCH/DELETE) with totals + 2% fee"
```

---

## Task 3: Wallet API + tests

**Files:**
- Create: `app/api/wallet/route.ts`, `tests/wallet-api.test.ts`

- [ ] **Step 1: Tests**

```ts
// tests/wallet-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/wallet/route";
import { setWalletBalance } from "@/lib/api/store";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
vi.mock("@/lib/api/error", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/error")>("@/lib/api/error");
  return { ...actual, maybeError: () => {} };
});

beforeEach(() => setWalletBalance(250_000));

describe("Wallet API", () => {
  it("GET returns balance + address", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.balanceNeon).toBe(250_000);
    expect(body.address).toMatch(/^0x/);
  });

  it("POST topup adds neon (debug)", async () => {
    const res = await POST(
      new Request("http://x", {
        method: "POST",
        body: JSON.stringify({ amount: 50_000 }),
        headers: { "content-type": "application/json" },
      }),
    );
    const body = await res.json();
    expect(body.balanceNeon).toBe(300_000);
  });
});
```

- [ ] **Step 2: Implementation**

```ts
// app/api/wallet/route.ts
import { NextResponse } from "next/server";
import { getWallet, setWalletBalance } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getWallet());
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    await delay(400, 900);
    maybeError(0.03);
    const body = (await req.json()) as { amount?: number };
    const amount = Math.max(0, Math.floor(body.amount ?? 0));
    const next = getWallet().balanceNeon + amount;
    setWalletBalance(next);
    return NextResponse.json(getWallet());
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- tests/wallet-api.test.ts
git add app/api/wallet tests/wallet-api.test.ts
git commit -m "feat: wallet API (GET balance, POST debug topup)"
```

---

## Task 4: Checkout API + tests

**Files:**
- Create: `app/api/checkout/route.ts`, `tests/checkout-api.test.ts`

- [ ] **Step 1: Tests**

```ts
// tests/checkout-api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/checkout/route";
import {
  addCartLine,
  clearCart,
  setWalletBalance,
  getWallet,
  getCartLines,
  getOrders,
} from "@/lib/api/store";

vi.mock("@/lib/api/delay", () => ({ delay: () => Promise.resolve() }));
// We DO want maybeError to fire deterministically per test below; mock rate by stubbing Math.random.

beforeEach(() => {
  clearCart();
  setWalletBalance(250_000);
});

describe("POST /api/checkout", () => {
  it("returns 400 if cart is empty", async () => {
    const res = await POST(new Request("http://x", { method: "POST" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("EMPTY_CART");
  });

  it("returns 402 if balance insufficient", async () => {
    setWalletBalance(10);
    addCartLine("mjolnir-exe", 1); // 4200 NEON + 2% fee
    const r = vi.spyOn(Math, "random").mockReturnValue(0.99); // skip 503
    const res = await POST(new Request("http://x", { method: "POST" }));
    r.mockRestore();
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error.code).toBe("INSUFFICIENT_NEON");
  });

  it("happy path: deducts wallet, clears cart, pushes order", async () => {
    addCartLine("mjolnir-exe", 2); // 8400 + 2% = 8568
    const beforeOrders = getOrders().length;
    const r = vi.spyOn(Math, "random").mockReturnValue(0.99); // skip 503
    const res = await POST(new Request("http://x", { method: "POST" }));
    r.mockRestore();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe("confirmed");
    expect(body.order.lines).toHaveLength(1);
    expect(body.order.txHash).toMatch(/^0x[0-9a-f]{32}$/);
    expect(body.wallet.balanceNeon).toBe(250_000 - 8568);
    expect(getCartLines()).toEqual([]);
    expect(getOrders().length).toBe(beforeOrders + 1);
  });
});
```

- [ ] **Step 2: Implementation**

```ts
// app/api/checkout/route.ts
import { NextResponse } from "next/server";
import {
  clearCart,
  getCartLines,
  getCartTotals,
  getOrders,
  getWallet,
  pushOrder,
  setWalletBalance,
} from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { ApiError, toErrorResponse } from "@/lib/api/error";
import type { Order } from "@/lib/client/types";

function genTxHash(): string {
  const hex = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

function genOrderId(): string {
  return "ord_" + Math.random().toString(36).slice(2, 10);
}

export async function POST(): Promise<Response> {
  try {
    await delay(1200, 1800);

    // 8% chance of simulated congestion
    if (Math.random() < 0.08) {
      throw new ApiError(503, "BLOCKCHAIN_CONGESTION", "Chain mempool full. Retry in a moment.");
    }

    const lines = getCartLines();
    if (lines.length === 0) {
      throw new ApiError(400, "EMPTY_CART", "Nothing to check out.");
    }

    const { total } = getCartTotals();
    const wallet = getWallet();
    if (wallet.balanceNeon < total) {
      throw new ApiError(
        402,
        "INSUFFICIENT_NEON",
        `Need ⟁ ${total.toLocaleString()}, have ⟁ ${wallet.balanceNeon.toLocaleString()}.`,
      );
    }

    setWalletBalance(wallet.balanceNeon - total);

    const order: Order = {
      id: genOrderId(),
      txHash: genTxHash(),
      lines,
      total,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    pushOrder(order);
    clearCart();

    return NextResponse.json({ order, wallet: getWallet() });
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 3: Run + commit**

```bash
npm test -- tests/checkout-api.test.ts
git add app/api/checkout tests/checkout-api.test.ts
git commit -m "feat: checkout API with insufficient/congestion error paths"
```

---

## Task 5: Orders API

**Files:**
- Create: `app/api/orders/route.ts`

- [ ] **Step 1: Implementation**

```ts
// app/api/orders/route.ts
import { NextResponse } from "next/server";
import { getOrders } from "@/lib/api/store";
import { delay } from "@/lib/api/delay";
import { maybeError, toErrorResponse } from "@/lib/api/error";

export async function GET(): Promise<Response> {
  try {
    await delay();
    maybeError(0.05);
    return NextResponse.json(getOrders());
  } catch (err) {
    return toErrorResponse(err);
  }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
node -e '
const http=require("http");
http.get("http://localhost:3000/api/orders",r=>{
  let b="";r.on("data",c=>b+=c);
  r.on("end",()=>{
    const arr=JSON.parse(b);
    console.log("orders:",arr.length,"first:",arr[0]?.id);
  });
});
'
git add app/api/orders/route.ts
git commit -m "feat: orders API (GET history newest-first)"
```

Expected: at least 6 seeded orders.

---

## Task 6: Replace useCart with API-backed version

**Files:**
- Rewrite: `lib/client/hooks/useCart.ts`
- Delete: `lib/client/cart-store.ts`
- Update: `tests/useCart-store.test.ts` → delete (no longer applicable; integration covers cart)

- [ ] **Step 1: Rewrite `lib/client/hooks/useCart.ts`**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { CartResponse } from "@/lib/client/types";

const KEY = "/api/cart";

const empty: CartResponse = { lines: [], items: [], subtotal: 0, fee: 0, total: 0 };

export function useCart() {
  const { data, error, isLoading, mutate } = useSWR<CartResponse>(KEY, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1500,
  });
  const cart = data ?? empty;

  const addItem = async (slug: string, qty = 1) => {
    await mutate(
      fetch(KEY, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, qty }),
      }).then((r) => r.json() as Promise<CartResponse>),
      {
        optimisticData: (prev) => {
          const base = prev ?? empty;
          const existing = base.lines.find((l) => l.itemSlug === slug);
          const lines = existing
            ? base.lines.map((l) => (l.itemSlug === slug ? { ...l, qty: l.qty + qty } : l))
            : [...base.lines, { itemSlug: slug, qty, addedAt: new Date().toISOString() }];
          return { ...base, lines };
        },
        rollbackOnError: true,
        revalidate: true,
      },
    );
  };

  const updateQty = async (slug: string, qty: number) => {
    await mutate(
      fetch(`${KEY}/${encodeURIComponent(slug)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ qty }),
      }).then((r) => r.json() as Promise<CartResponse>),
      { rollbackOnError: true, revalidate: true },
    );
  };

  const removeItem = async (slug: string) => {
    await mutate(
      fetch(`${KEY}/${encodeURIComponent(slug)}`, { method: "DELETE" }).then(
        (r) => r.json() as Promise<CartResponse>,
      ),
      { rollbackOnError: true, revalidate: true },
    );
  };

  const clear = async () => {
    await mutate(
      fetch(KEY, { method: "DELETE" }).then((r) => r.json() as Promise<CartResponse>),
      { rollbackOnError: true, revalidate: true },
    );
  };

  const count = cart.lines.reduce((n, l) => n + l.qty, 0);

  return { cart, count, addItem, updateQty, removeItem, clear, isLoading, error, mutate };
}
```

- [ ] **Step 2: Delete temporary store + test**

```bash
git rm lib/client/cart-store.ts tests/useCart-store.test.ts
```

- [ ] **Step 3: Type-check + run all unit tests**

```bash
npx tsc --noEmit
npm test
```

All previously-passing tests continue to pass; the deleted ones are gone.

- [ ] **Step 4: Commit**

```bash
git add lib/client/hooks/useCart.ts
git commit -m "refactor: useCart API-backed with optimistic updates; drop in-memory store"
```

---

## Task 7: Wallet hook + Header integration

**Files:**
- Create: `lib/client/hooks/useWallet.ts`
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Hook**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { Wallet } from "@/lib/client/types";

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR<Wallet>("/api/wallet", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1500,
  });
  return { wallet: data, isLoading, error, mutate };
}
```

- [ ] **Step 2: Header integration**

In `components/layout/Header.tsx`, replace the hardcoded balance chip:

```tsx
"use client";

import Link from "next/link";
import { formatNeon } from "@/lib/format";
import { useCart } from "@/lib/client/hooks/useCart";
import { useWallet } from "@/lib/client/hooks/useWallet";

export function Header() {
  const { count } = useCart();
  const { wallet, isLoading } = useWallet();

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
          <Link
            href="/profile"
            className="cp-chip cp-chip--yellow font-cp-mono text-xs"
            aria-label={`Wallet balance ${wallet?.balanceNeon ?? 0} NEON`}
          >
            {isLoading ? "⟁ ···" : formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}
          </Link>
          <Link
            href="/profile"
            className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--sm"
            aria-label="John Tran profile"
          >
            <span className="cp-avatar__initials">JT</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add lib/client/hooks/useWallet.ts components/layout/Header.tsx
git commit -m "feat: useWallet hook + header reads real balance, links wallet/profile"
```

---

## Task 8: Toaster

**Files:**
- Create: `components/feedback/Toaster.tsx`

A tiny toast pub-sub used by mutation flows.

- [ ] **Step 1: Create Toaster**

```tsx
"use client";

import { useEffect, useState } from "react";

type Tone = "success" | "info" | "warning" | "danger";
type Toast = { id: number; tone: Tone; title?: string; message: string };

let nextId = 1;
const subs = new Set<(t: Toast) => void>();

export function pushToast(t: Omit<Toast, "id">) {
  const toast = { ...t, id: nextId++ };
  for (const fn of subs) fn(toast);
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const fn = (t: Toast) => {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4500);
    };
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  }, []);
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 w-80" role="log" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`cp-toast cp-toast--${t.tone}`}
          role="status"
          style={{ animation: "cm-modal-in 280ms cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div className="cp-toast__icon">{t.tone === "success" ? "✓" : t.tone === "danger" ? "!" : "▣"}</div>
          <div className="cp-toast__body">
            {t.title && <p className="cp-toast__title">{t.title}</p>}
            <p>{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Mount in root layout**

In `app/layout.tsx`, inside `<ItemPreviewProvider>`, add `<Toaster />`:

```tsx
<ItemPreviewProvider>
  <Header />
  <TickerTape items={TICKER_ITEMS} />
  <main className="cp-container py-8 min-h-[60vh]">{children}</main>
  <Footer />
  <Toaster />
</ItemPreviewProvider>
```

(Add `import { Toaster } from "@/components/feedback/Toaster";` at top.)

- [ ] **Step 3: Use toast in `useCart.addItem` failure path**

In `useCart.ts`, wrap the mutate call:

```ts
import { pushToast } from "@/components/feedback/Toaster";

// inside addItem:
try {
  await mutate(...);
  pushToast({ tone: "success", message: `Added ${qty}× to cart` });
} catch (e) {
  pushToast({ tone: "danger", title: "ICE_INTERFERENCE", message: "Failed to add. Retry." });
  throw e;
}
```

(Repeat for updateQty/removeItem/clear with appropriate messages.)

- [ ] **Step 4: Type-check + commit**

```bash
npx tsc --noEmit
git add components/feedback/Toaster.tsx app/layout.tsx lib/client/hooks/useCart.ts
git commit -m "feat: Toaster + cart mutation success/error toasts"
```

---

## Task 9: CartLine + CartDrawer

**Files:**
- Create: `components/cart/CartLine.tsx`, `components/cart/CartDrawer.tsx`

- [ ] **Step 1: `CartLine.tsx`**

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import type { Weapon } from "@/lib/client/types";
import { formatNeon } from "@/lib/format";
import { QtyStepper } from "@/components/item/QtyStepper";

type Props = {
  weapon: Weapon;
  qty: number;
  onQty: (n: number) => void;
  onRemove: () => void;
};

export function CartLine({ weapon, qty, onQty, onRemove }: Props) {
  return (
    <div className="grid grid-cols-[80px_1fr_auto_auto_auto] items-center gap-4 py-4 border-b border-cp-border">
      <Link href={`/browse/${weapon.slug}`} className="block w-20 h-20 relative overflow-hidden border border-cp-border">
        <Image src={weapon.imageUrl} alt={weapon.name} fill sizes="80px" style={{ objectFit: "cover" }} />
      </Link>
      <div>
        <Link href={`/browse/${weapon.slug}`} className="font-cp-display hover:text-cp-cyan-500">
          {weapon.name}
        </Link>
        <div className="text-cp-fg-muted text-xs mt-1">{weapon.seller}</div>
      </div>
      <QtyStepper value={qty} min={1} max={Math.max(1, weapon.stock)} onChange={onQty} />
      <div className="font-cp-mono text-cp-yellow-500 text-right min-w-[90px]">
        {formatNeon(weapon.priceNeon * qty, { compact: true })}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="px-2 py-1 text-cp-magenta-500 hover:text-cp-magenta-300"
        aria-label={`Remove ${weapon.name}`}
      >
        ✕
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `CartDrawer.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useCart } from "@/lib/client/hooks/useCart";
import { formatNeon } from "@/lib/format";
import { CartLine } from "./CartLine";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, updateQty, removeItem } = useCart();

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-cp-bg/70 backdrop-blur transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute right-0 top-0 bottom-0 w-[420px] max-w-full bg-cp-bg-soft border-l border-cp-cyan-500/40 shadow-cp-glow-cyan transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ transitionDuration: "320ms", transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-cp-border">
          <h2 id="cart-drawer-title" className="font-cp-display text-lg text-cp-cyan-500">⌗ CART</h2>
          <button onClick={onClose} aria-label="Close cart" className="px-3 py-1 hover:text-cp-magenta-500">✕</button>
        </header>
        <div className="overflow-y-auto px-4">
          {cart.lines.length === 0 ? (
            <p className="text-cp-fg-muted text-sm py-8 text-center">No weapons in cache.</p>
          ) : (
            cart.lines.map((line) => {
              const weapon = cart.items.find((w) => w.slug === line.itemSlug);
              if (!weapon) return null;
              return (
                <CartLine
                  key={line.itemSlug}
                  weapon={weapon}
                  qty={line.qty}
                  onQty={(n) => updateQty(line.itemSlug, n)}
                  onRemove={() => removeItem(line.itemSlug)}
                />
              );
            })
          )}
        </div>
        <footer className="px-4 py-4 border-t border-cp-border">
          <div className="flex justify-between text-sm text-cp-fg-muted">
            <span>Subtotal</span>
            <span className="font-cp-mono">{formatNeon(cart.subtotal, { compact: true })}</span>
          </div>
          <div className="flex justify-between text-sm text-cp-fg-muted">
            <span>Blockchain fee (2%)</span>
            <span className="font-cp-mono">{formatNeon(cart.fee, { compact: true })}</span>
          </div>
          <div className="flex justify-between text-cp-yellow-500 font-cp-mono text-lg mt-2">
            <span>TOTAL</span>
            <span>{formatNeon(cart.total, { compact: true })}</span>
          </div>
          <Link
            href="/checkout"
            onClick={onClose}
            className={`block mt-4 px-4 py-3 text-center font-cp-display font-bold tracking-widest transition ${
              cart.lines.length === 0 ? "opacity-40 pointer-events-none" : "hover:brightness-110 shadow-cp-glow-magenta"
            }`}
            style={{
              background: "var(--cp-magenta-500, #ff00ea)",
              color: "#04050b",
              clipPath:
                "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
            }}
          >
            CHECKOUT ›
          </Link>
        </footer>
      </aside>
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add components/cart/CartLine.tsx components/cart/CartDrawer.tsx
git commit -m "feat: CartLine + CartDrawer with optimistic mutations"
```

---

## Task 10: /cart full page

**Files:**
- Create: `app/cart/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
"use client";

import Link from "next/link";
import { useCart } from "@/lib/client/hooks/useCart";
import { CartLine } from "@/components/cart/CartLine";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNeon } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function CartPage() {
  const { cart, updateQty, removeItem, isLoading } = useCart();

  if (isLoading) {
    return <p className="text-cp-fg-muted">scanning cache...</p>;
  }
  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon="⌗"
        title="No weapons in cache"
        desc="The arsenal is full of relics. Go acquire some."
        cta={
          <Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">
            BROWSE ARSENAL ›
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      <section>
        <NeonHeading level="lg" rarity="cyan">{"// CART"}</NeonHeading>
        <div className="mt-6">
          {cart.lines.map((line) => {
            const weapon = cart.items.find((w) => w.slug === line.itemSlug);
            if (!weapon) return null;
            return (
              <CartLine
                key={line.itemSlug}
                weapon={weapon}
                qty={line.qty}
                onQty={(n) => updateQty(line.itemSlug, n)}
                onRemove={() => removeItem(line.itemSlug)}
              />
            );
          })}
        </div>
      </section>

      <aside className="sticky top-24 border border-cp-border bg-cp-bg-soft p-5">
        <div className="font-cp-mono text-[10px] tracking-[0.4em] text-cp-cyan-500 mb-3">// SUMMARY</div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-cp-fg-muted">Subtotal</span><span className="font-cp-mono">{formatNeon(cart.subtotal, { compact: true })}</span></div>
          <div className="flex justify-between"><span className="text-cp-fg-muted">Blockchain fee (2%)</span><span className="font-cp-mono">{formatNeon(cart.fee, { compact: true })}</span></div>
          <div className="flex justify-between text-cp-yellow-500 font-cp-mono text-2xl mt-2 border-t border-cp-border pt-2">
            <span>TOTAL</span><span>{formatNeon(cart.total, { compact: true })}</span>
          </div>
        </div>
        <Link
          href="/checkout"
          className="block mt-5 px-4 py-3 text-center font-cp-display font-bold tracking-widest hover:brightness-110 transition shadow-cp-glow-magenta"
          style={{
            background: "var(--cp-magenta-500, #ff00ea)",
            color: "#04050b",
            clipPath:
              "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
          }}
        >
          PROCEED TO CHECKOUT ›
        </Link>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Smoke + commit**

```bash
node -e '
const http=require("http");
http.get("http://localhost:3000/cart",r=>{
  let b="";r.on("data",c=>b+=c);
  r.on("end",()=>{
    console.log("status=",r.statusCode,"len=",b.length,
      "markers=",["// CART","SUMMARY"].every(s=>b.includes(s))?"OK":"MISS");
  });
});
'
git add app/cart/page.tsx
git commit -m "feat: /cart full page with sticky summary rail"
```

---

## Task 11: CheckoutTerminal modal component

**Files:**
- Create: `components/cart/CheckoutTerminal.tsx`

- [ ] **Step 1: Create**

```tsx
"use client";

import { useEffect, useState } from "react";

type Line = { text: string; tone?: "ok" | "warn" | "err" };

export function CheckoutTerminal({
  lines,
  onComplete,
  finalTxHash,
}: {
  lines: string[];
  onComplete?: () => void;
  finalTxHash?: string;
}) {
  const [shown, setShown] = useState<Line[]>([]);

  useEffect(() => {
    let cancelled = false;
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      if (i >= lines.length) {
        if (finalTxHash) {
          setShown((prev) => [...prev, { text: `> tx confirmed: ${finalTxHash}`, tone: "ok" }]);
        }
        onComplete?.();
        return;
      }
      setShown((prev) => [...prev, { text: lines[i] }]);
      i++;
      setTimeout(tick, 280 + Math.random() * 220);
    };
    tick();
    return () => {
      cancelled = true;
    };
  }, [lines, finalTxHash, onComplete]);

  return (
    <div className="cp-terminal cp-terminal--green cp-terminal--scanlines">
      <div className="cp-terminal__header">
        <span className="cp-terminal__dots"><i /><i /><i /></span>
        <span className="cp-terminal__title">root@nightcity ~ %</span>
      </div>
      <div className="cp-terminal__body">
        {shown.map((l, i) => (
          <div
            key={i}
            className={`cp-terminal__line ${
              l.tone === "ok" ? "cp-terminal__line--ok" : l.tone === "err" ? "cp-terminal__line--err" : "cp-terminal__line--cmd"
            }`}
          >
            {l.text}
          </div>
        ))}
        <div className="cp-terminal__caret" aria-hidden>▌</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check + commit**

```bash
npx tsc --noEmit
git add components/cart/CheckoutTerminal.tsx
git commit -m "feat: CheckoutTerminal typewriter modal"
```

---

## Task 12: useCheckout + /checkout page

**Files:**
- Create: `lib/client/hooks/useCheckout.ts`, `app/checkout/page.tsx`

- [ ] **Step 1: Hook**

```ts
"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { ClientApiError, fetcher } from "@/lib/client/fetcher";
import type { Order, Wallet } from "@/lib/client/types";

export function useCheckout() {
  const { mutate } = useSWRConfig();
  const [isProcessing, setProcessing] = useState(false);
  const [lastError, setError] = useState<ClientApiError | null>(null);

  const checkout = async (): Promise<{ order: Order; wallet: Wallet }> => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ClientApiError(
          res.status,
          body?.error?.code ?? "UNKNOWN",
          body?.error?.message,
        );
      }
      const data = (await res.json()) as { order: Order; wallet: Wallet };
      // bust caches
      await Promise.all([mutate("/api/cart"), mutate("/api/wallet"), mutate("/api/orders")]);
      return data;
    } catch (e) {
      setError(e as ClientApiError);
      throw e;
    } finally {
      setProcessing(false);
    }
  };

  return { checkout, isProcessing, lastError };
}
```

- [ ] **Step 2: `/checkout/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/client/hooks/useCart";
import { useCheckout } from "@/lib/client/hooks/useCheckout";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { CheckoutTerminal } from "@/components/cart/CheckoutTerminal";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNeon, formatTxHash } from "@/lib/format";
import type { Order } from "@/lib/client/types";

const STEPS = ["Review", "Confirm Wallet", "Sign"];
const TERMINAL_LINES = [
  "> handshake: connecting to chain-relay...",
  "> verifying wallet 0xJohnT...4ran ok",
  "> bundling 1 transaction(s)",
  "> broadcasting to mempool",
  "> waiting for confirmation",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCart();
  const { wallet } = useWallet();
  const { checkout, isProcessing, lastError } = useCheckout();
  const [step, setStep] = useState(0);
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState<Order | null>(null);

  if (cart.lines.length === 0 && !done) {
    return (
      <EmptyState
        icon="⌗"
        title="Nothing to check out"
        desc="Your cart is empty."
        cta={<Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">BROWSE ARSENAL ›</Link>}
      />
    );
  }

  const onSign = async () => {
    setSigning(true);
    try {
      const { order } = await checkout();
      setDone(order);
    } catch {
      // error toast surfaced via useCart/useCheckout
      setSigning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* Stepper */}
      <ol className="flex items-center gap-3 text-xs font-cp-mono">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex items-center gap-2 ${i <= step ? "text-cp-cyan-500" : "text-cp-fg-muted"}`}
          >
            <span
              className={`w-7 h-7 grid place-items-center border ${
                i < step ? "border-cp-green-500 text-cp-green-500" : i === step ? "border-cp-cyan-500" : "border-cp-border"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className="uppercase tracking-widest">{s}</span>
            {i < STEPS.length - 1 && <span className="w-10 h-px bg-cp-border" />}
          </li>
        ))}
      </ol>

      {/* Step content */}
      {!done && step === 0 && (
        <section>
          <h2 className="cp-heading cp-heading--md">Review your order</h2>
          <ul className="mt-4 divide-y divide-cp-border">
            {cart.lines.map((l) => {
              const w = cart.items.find((x) => x.slug === l.itemSlug);
              if (!w) return null;
              return (
                <li key={l.itemSlug} className="py-3 flex justify-between">
                  <span>{w.name} <span className="text-cp-fg-muted text-xs">×{l.qty}</span></span>
                  <span className="font-cp-mono">{formatNeon(w.priceNeon * l.qty, { compact: true })}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 text-right">
            <span className="text-cp-fg-muted text-sm">Total: </span>
            <span className="font-cp-mono text-cp-yellow-500 text-2xl">{formatNeon(cart.total, { compact: true })}</span>
          </div>
          <button onClick={() => setStep(1)} className="mt-6 cp-btn cp-btn--neon cp-btn--cyan">CONTINUE ›</button>
        </section>
      )}

      {!done && step === 1 && (
        <section>
          <h2 className="cp-heading cp-heading--md">Confirm wallet</h2>
          <p className="text-cp-fg-muted text-sm mt-2">Pay from {wallet?.address ?? "—"}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="border border-cp-border p-4"><div className="text-cp-fg-muted text-xs">Balance</div><div className="font-cp-mono text-xl mt-1">{formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}</div></div>
            <div className="border border-cp-border p-4"><div className="text-cp-fg-muted text-xs">After</div><div className="font-cp-mono text-xl mt-1 text-cp-yellow-500">{formatNeon((wallet?.balanceNeon ?? 0) - cart.total, { compact: true })}</div></div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setStep(0)} className="cp-btn cp-btn--ghost">‹ BACK</button>
            <button onClick={() => setStep(2)} className="cp-btn cp-btn--neon cp-btn--cyan">CONTINUE ›</button>
          </div>
        </section>
      )}

      {!done && step === 2 && (
        <section>
          <h2 className="cp-heading cp-heading--md">Sign &amp; broadcast</h2>
          {!signing ? (
            <>
              <p className="text-cp-fg-muted text-sm mt-2">Press to broadcast the transaction.</p>
              <button onClick={onSign} disabled={isProcessing} className="mt-4 cp-btn cp-btn--neon cp-btn--magenta">⟁ SIGN &amp; SEND</button>
              {lastError && <p className="mt-3 text-cp-red text-sm">[{lastError.code}] {lastError.message}</p>}
            </>
          ) : (
            <div className="mt-4">
              <CheckoutTerminal lines={TERMINAL_LINES} />
            </div>
          )}
        </section>
      )}

      {done && (
        <section className="border border-cp-green-500/40 bg-cp-bg-soft p-6 shadow-cp-glow-green">
          <h2 className="cp-heading cp-heading--md text-cp-green-500">✓ TRANSACTION CONFIRMED</h2>
          <p className="text-cp-fg-muted text-sm mt-2">
            Order <span className="font-cp-mono">{done.id}</span> · tx{" "}
            <span className="font-cp-mono">{formatTxHash(done.txHash)}</span>
          </p>
          <div className="mt-2 font-cp-mono text-2xl text-cp-yellow-500">{formatNeon(done.total, { compact: true })}</div>
          <div className="mt-6 flex gap-3">
            <Link href="/orders" className="cp-btn cp-btn--neon cp-btn--cyan">VIEW ORDERS ›</Link>
            <Link href="/browse" className="cp-btn cp-btn--ghost">CONTINUE BROWSING</Link>
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
npx tsc --noEmit
git add lib/client/hooks/useCheckout.ts app/checkout/page.tsx
git commit -m "feat: /checkout page with 3-step stepper + terminal modal + tx confirmation"
```

---

## Task 13: useOrders hook + /orders page

**Files:**
- Create: `lib/client/hooks/useOrders.ts`, `app/orders/page.tsx`

- [ ] **Step 1: Hook**

```ts
"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { Order } from "@/lib/client/types";

export function useOrders() {
  const { data, error, isLoading, mutate } = useSWR<Order[]>("/api/orders", fetcher, {
    revalidateOnFocus: false,
  });
  return { orders: data ?? [], isLoading, error, mutate };
}
```

- [ ] **Step 2: `/orders/page.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useOrders } from "@/lib/client/hooks/useOrders";
import { useItems } from "@/lib/client/hooks/useItems";
import { formatNeon, formatRelativeTime, formatTxHash } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";
import { EmptyState } from "@/components/feedback/EmptyState";
import Image from "next/image";

export default function OrdersPage() {
  const { orders, isLoading, error } = useOrders();
  const { items } = useItems({});

  const slugMap = new Map(items.map((w) => [w.slug, w]));

  if (isLoading) return <p className="text-cp-fg-muted">Loading order log...</p>;
  if (error) return <p className="text-cp-red">[{(error as { code?: string }).code ?? "ERR"}] {error.message}</p>;
  if (orders.length === 0) {
    return <EmptyState title="No orders yet" desc="Your transaction history is empty." cta={<Link href="/browse" className="cp-btn cp-btn--neon cp-btn--cyan">BROWSE ARSENAL ›</Link>} />;
  }

  return (
    <div>
      <NeonHeading level="lg" rarity="cyan">{"// ORDER HISTORY"}</NeonHeading>
      <ol className="cp-timeline mt-8">
        {orders.map((o) => (
          <li
            key={o.id}
            className={`cp-timeline__item ${
              o.status === "confirmed" ? "cp-timeline__item--green" : o.status === "failed" ? "cp-timeline__item--red" : "cp-timeline__item--yellow"
            }`}
          >
            <span className="cp-timeline__time font-cp-mono">{formatRelativeTime(o.createdAt)}</span>
            <span className="cp-timeline__marker" />
            <div className="cp-timeline__content">
              <p className="cp-timeline__title">
                Order {o.id} ·{" "}
                <span className="text-cp-fg-muted">tx </span>
                <button
                  type="button"
                  className="font-cp-mono text-cp-cyan-500 hover:underline"
                  onClick={() => navigator.clipboard?.writeText(o.txHash)}
                  aria-label="Copy tx hash"
                >
                  {formatTxHash(o.txHash)}
                </button>
              </p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {o.lines.map((l) => {
                  const w = slugMap.get(l.itemSlug);
                  if (!w) return <span key={l.itemSlug} className="text-cp-fg-muted text-xs">{l.itemSlug} ×{l.qty}</span>;
                  return (
                    <Link key={l.itemSlug} href={`/browse/${w.slug}`} className="flex items-center gap-2 border border-cp-border px-2 py-1 hover:border-cp-cyan-500">
                      <span className="block w-6 h-6 relative overflow-hidden">
                        <Image src={w.imageUrl} alt={w.name} fill sizes="24px" style={{ objectFit: "cover" }} />
                      </span>
                      <span className="text-xs">{w.name} ×{l.qty}</span>
                    </Link>
                  );
                })}
              </div>
              <p className="mt-2 text-cp-yellow-500 font-cp-mono">{formatNeon(o.total, { compact: true })}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Smoke + commit**

```bash
git add lib/client/hooks/useOrders.ts app/orders/page.tsx
git commit -m "feat: /orders timeline page with copy tx-hash + item thumbnails"
```

---

## Task 14: /profile page (inventory + tabs)

**Files:**
- Create: `app/profile/page.tsx`

- [ ] **Step 1: Implementation**

```tsx
"use client";

import { useMemo, useState } from "react";
import { useOrders } from "@/lib/client/hooks/useOrders";
import { useItems } from "@/lib/client/hooks/useItems";
import { useWallet } from "@/lib/client/hooks/useWallet";
import { ItemCard } from "@/components/item/ItemCard";
import { EmptyState } from "@/components/feedback/EmptyState";
import { formatNeon } from "@/lib/format";
import { NeonHeading } from "@/components/decorative/NeonHeading";

export default function ProfilePage() {
  const { wallet } = useWallet();
  const { orders } = useOrders();
  const { items } = useItems({});
  const [tab, setTab] = useState<"inventory" | "history">("inventory");

  const inventory = useMemo(() => {
    const owned = new Map<string, number>();
    for (const o of orders) {
      if (o.status !== "confirmed") continue;
      for (const l of o.lines) owned.set(l.itemSlug, (owned.get(l.itemSlug) ?? 0) + l.qty);
    }
    return Array.from(owned.entries())
      .map(([slug, qty]) => ({ weapon: items.find((w) => w.slug === slug), qty }))
      .filter((x): x is { weapon: NonNullable<typeof x.weapon>; qty: number } => Boolean(x.weapon));
  }, [orders, items]);

  return (
    <div>
      <header className="flex items-center gap-6 mb-8">
        <span className="cp-avatar cp-avatar--ring cp-avatar--magenta cp-avatar--lg">
          <span className="cp-avatar__initials">JT</span>
        </span>
        <div>
          <h1 className="cp-heading cp-heading--md">John Tran</h1>
          <p className="text-cp-fg-muted font-cp-mono text-xs mt-1">@ {wallet?.address ?? "—"}</p>
        </div>
        <div className="ml-auto border border-cp-yellow-500/40 px-4 py-2 shadow-cp-glow-yellow">
          <div className="font-cp-mono text-[10px] tracking-[0.3em] text-cp-fg-muted">BALANCE</div>
          <div className="font-cp-mono text-2xl text-cp-yellow-500 font-bold">
            {formatNeon(wallet?.balanceNeon ?? 0, { compact: true })}
          </div>
        </div>
      </header>

      <div className="cp-tabs">
        <div className="cp-tabs__list" role="tablist">
          <button onClick={() => setTab("inventory")} className="cp-tabs__tab" data-state={tab === "inventory" ? "active" : ""}>Inventory</button>
          <button onClick={() => setTab("history")} className="cp-tabs__tab" data-state={tab === "history" ? "active" : ""}>Order history</button>
        </div>
        <div className="cp-tabs__panels mt-6">
          {tab === "inventory" && (
            inventory.length === 0 ? (
              <EmptyState title="Empty inventory" desc="Buy something to see it here." />
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {inventory.map(({ weapon, qty }, i) => (
                  <div key={weapon.slug} className="relative">
                    <ItemCard weapon={weapon} index={i} />
                    {qty > 1 && (
                      <span className="absolute top-2 left-2 cp-badge cp-badge--cyan z-10">×{qty}</span>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
          {tab === "history" && (
            <NeonHeading level="md" rarity="cyan">See <a href="/orders" className="underline">/orders</a></NeonHeading>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Smoke + commit**

```bash
git add app/profile/page.tsx
git commit -m "feat: /profile page with inventory tab"
```

---

## Task 15: e2e — full transaction happy path

**Files:**
- Create: `e2e/cart-checkout.spec.ts`

- [ ] **Step 1: Write test**

```ts
import { test, expect } from "@playwright/test";

test("happy path: browse → add → cart → checkout → order", async ({ page }) => {
  await page.goto("/browse/mjolnir-exe");
  await expect(page.getByText("DAMAGE")).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /ADD TO CART/ }).click();

  // Header badge shows 1
  await expect(page.locator("header").getByText("1")).toBeVisible({ timeout: 5_000 });

  await page.goto("/cart");
  await expect(page.getByText("// CART")).toBeVisible();
  await expect(page.getByText("MJOLNIR.exe")).toBeVisible();

  await page.getByRole("link", { name: /PROCEED TO CHECKOUT/ }).click();
  await expect(page.getByText("Review your order")).toBeVisible();
  await page.getByRole("button", { name: /CONTINUE/ }).click();
  await expect(page.getByText("Confirm wallet")).toBeVisible();
  await page.getByRole("button", { name: /CONTINUE/ }).click();
  await expect(page.getByText("Sign & broadcast")).toBeVisible();
  await page.getByRole("button", { name: /SIGN & SEND/ }).click();

  // Wait for confirmation
  await expect(page.getByText("TRANSACTION CONFIRMED")).toBeVisible({ timeout: 15_000 });

  // Visit orders
  await page.getByRole("link", { name: /VIEW ORDERS/ }).click();
  await expect(page.getByText("// ORDER HISTORY")).toBeVisible();
  await expect(page.getByText(/MJOLNIR\.exe/)).toBeVisible();
});
```

- [ ] **Step 2: Run + commit (retry once if 503/8% congestion hit)**

```bash
npm run e2e -- e2e/cart-checkout.spec.ts
git add e2e/cart-checkout.spec.ts
git commit -m "test: e2e for full add → checkout → orders flow"
```

---

## Definition of Done — Plan 3

1. ✅ `/api/cart`, `/api/cart/[slug]`, `/api/wallet`, `/api/checkout`, `/api/orders` all return correct shapes
2. ✅ Cart fee/total computed server-side; checkout deducts wallet + clears cart + pushes order
3. ✅ Header shows real wallet balance and live cart count
4. ✅ Toaster surfaces success/error from cart mutations
5. ✅ `/cart` shows lines + summary; empty state when zero
6. ✅ `/checkout` 3-step stepper + terminal typewriter + confirmation panel
7. ✅ `/orders` timeline shows seeded + new orders with copy-tx-hash
8. ✅ `/profile` inventory tab shows owned weapons aggregated from confirmed orders
9. ✅ All unit tests pass; cart-checkout e2e passes (allow 1 retry for 8% congestion)
10. ✅ `npx tsc --noEmit` and `npm run build` exit 0
