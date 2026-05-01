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
