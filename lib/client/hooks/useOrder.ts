"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { Order } from "@/lib/client/types";

export function useOrder(id: string | undefined) {
  const key = id ? `/api/orders/${encodeURIComponent(id)}` : null;
  const { data, error, isLoading, mutate } = useSWR<Order>(key, fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: true,
    errorRetryCount: 2,
    errorRetryInterval: 800,
    dedupingInterval: 2000,
  });
  return { order: data, isLoading, error, mutate };
}
