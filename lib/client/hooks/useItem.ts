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
