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
