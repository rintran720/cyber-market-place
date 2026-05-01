"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import { pushToast } from "@/components/feedback/Toaster";
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
    const doFetch = () =>
      fetch(KEY, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, qty }),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`cart POST failed: ${r.status}`);
        return r.json() as Promise<CartResponse>;
      });
    try {
      await mutate(doFetch(), {
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
      });
      pushToast({ tone: "success", message: `Added ${qty}× to cart` });
    } catch (e) {
      pushToast({ tone: "danger", title: "ICE_INTERFERENCE", message: "Failed to add. Retry." });
      throw e;
    }
  };

  const updateQty = async (slug: string, qty: number) => {
    try {
      await mutate(
        fetch(`${KEY}/${encodeURIComponent(slug)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ qty }),
        }).then((r) => r.json() as Promise<CartResponse>),
        { rollbackOnError: true, revalidate: true },
      );
      pushToast({ tone: "success", message: `Updated quantity` });
    } catch (e) {
      pushToast({ tone: "danger", title: "ICE_INTERFERENCE", message: "Failed to update qty. Retry." });
      throw e;
    }
  };

  const removeItem = async (slug: string) => {
    try {
      await mutate(
        fetch(`${KEY}/${encodeURIComponent(slug)}`, { method: "DELETE" }).then(
          (r) => r.json() as Promise<CartResponse>,
        ),
        { rollbackOnError: true, revalidate: true },
      );
      pushToast({ tone: "info", message: `Removed from cart` });
    } catch (e) {
      pushToast({ tone: "danger", title: "ICE_INTERFERENCE", message: "Failed to remove. Retry." });
      throw e;
    }
  };

  const clear = async () => {
    try {
      await mutate(
        fetch(KEY, { method: "DELETE" }).then((r) => r.json() as Promise<CartResponse>),
        { rollbackOnError: true, revalidate: true },
      );
      pushToast({ tone: "info", message: `Cart cleared` });
    } catch (e) {
      pushToast({ tone: "danger", title: "ICE_INTERFERENCE", message: "Failed to clear cart. Retry." });
      throw e;
    }
  };

  const count = cart.lines.reduce((n, l) => n + l.qty, 0);

  return { cart, count, addItem, updateQty, removeItem, clear, isLoading, error, mutate };
}
