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
