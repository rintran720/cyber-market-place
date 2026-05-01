"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/client/fetcher";
import type { Wallet } from "@/lib/client/types";

export function useWallet() {
  const { data, error, isLoading, mutate } = useSWR<Wallet>("/api/wallet", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1500,
  });
  return { wallet: data, isLoading, error, mutate };
}
