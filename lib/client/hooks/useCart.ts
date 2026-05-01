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
