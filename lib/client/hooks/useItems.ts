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
