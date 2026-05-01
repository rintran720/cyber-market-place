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
