"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { SellerStats } from "@/lib/client/types";

type SellerStatsExt = SellerStats & { sales30d: number[] };

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<SellerStatsExt>("/api/stats", fetcher, {
    revalidateOnFocus: false,
  });
  return { stats: data, isLoading, error, mutate };
}
