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
